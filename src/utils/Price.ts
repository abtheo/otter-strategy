import {
  USDC_MATIC_AGGREGATOR,
  MATIC_ERC20,
  DYST_ERC20,
  FRAX_ERC20,
  USDPLUS_ERC20,
  MAI_ERC20,
  USDC_ERC20,
  CLAM_ERC20,
  PEN_ERC20,
  WETH_ERC20,
  PENDYST_ERC20,
  QI_ERC20,
  OCQI_CONTRACT,
  DYST_POOL_TRANSITION_BLOCK,
  TETU_QI_ERC20,
  TUSD_ERC20,
  STMATIC_ERC20,
  LDO_ERC20,
  DAI_USD_AGGREGATOR,
  MAI_USD_AGGREGATOR,
  DAI_ERC20,
  USDC_USD_AGGREGATOR,
} from './Constants'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/OtterClamERC20V2/UniswapV2Pair'
import { ArrakisVault } from '../../generated/OtterClamERC20V2/ArrakisVault'
import { AggregatorV3InterfaceABI } from '../../generated/OtterClamERC20V2/AggregatorV3InterfaceABI'
import { toDecimal } from './Decimals'
import { DystPair } from '../../generated/OtterClamERC20V2/DystPair'
import { ERC20 } from '../../generated/OtterClamERC20V2/ERC20'
import { dyst, quickSwap, Exchange } from './Exchange'

function findTokenPrice(exchange: Exchange, inTokenAddress: Address, outTokenAddress: Address): BigDecimal {
  let inToken = ERC20.bind(inTokenAddress)
  let outToken = ERC20.bind(outTokenAddress)
  let inDecimals = inToken.decimals()
  let outDecimals = outToken.decimals()
  let price = exchange.getAmountOut(BigInt.fromI64(<i64>Math.pow(10, inDecimals)), inTokenAddress, outTokenAddress)
  return toDecimal(price, outDecimals)
}

export function getwMaticUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(USDC_MATIC_AGGREGATOR)
  let wmaticPrice = pair.latestRoundData()
  return toDecimal(wmaticPrice.value1, pair.decimals())
}

export function getUsdcUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(USDC_USD_AGGREGATOR)
  let usdcPrice = pair.latestRoundData()
  let decimalPrice = toDecimal(usdcPrice.value1, pair.decimals())
  log.info('USDC exchange rate: {}', [decimalPrice.toString()])
  return decimalPrice
}
export function getDaiUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(DAI_USD_AGGREGATOR)
  let daiPrice = pair.latestRoundData()
  let decimalPrice = toDecimal(daiPrice.value1, pair.decimals())
  log.info('DAI exchange rate: {}', [decimalPrice.toString()])
  return decimalPrice
}

export function getMaiUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(MAI_USD_AGGREGATOR)
  let maiPrice = pair.latestRoundData()
  let decimalPrice = toDecimal(maiPrice.value1, pair.decimals())
  log.info('MAI exchange rate: {}', [decimalPrice.toString()])
  return decimalPrice
}

export function getStMaticUsdRate(): BigDecimal {
  return findTokenPrice(dyst, STMATIC_ERC20, USDPLUS_ERC20)
}

export function getQiUsdRate(): BigDecimal {
  let wmaticPerQi = findTokenPrice(quickSwap, QI_ERC20, MATIC_ERC20)
  let usdPerQi = wmaticPerQi.times(getwMaticUsdRate())

  return usdPerQi
}

export function getLdoUsdRate(): BigDecimal {
  let wmaticPerLdo = findTokenPrice(quickSwap, LDO_ERC20, MATIC_ERC20)
  let usdPerLdo = wmaticPerLdo.times(getwMaticUsdRate())

  return usdPerLdo
}

export function getTetuQiUsdRate(blockNumber: BigInt): BigDecimal {
  let qiPerTetuQi = BigDecimal.fromString('1')

  if (blockNumber.gt(BigInt.fromString('28404188'))) {
    qiPerTetuQi = findTokenPrice(dyst, TETU_QI_ERC20, QI_ERC20)
  }

  let wmaticPerQi = findTokenPrice(quickSwap, QI_ERC20, MATIC_ERC20)
  let usdPerTetuQi = qiPerTetuQi.times(wmaticPerQi).times(getwMaticUsdRate())

  return usdPerTetuQi
}

export function getDystUsdRate(): BigDecimal {
  let wmaticPerDyst = findTokenPrice(dyst, DYST_ERC20, MATIC_ERC20)
  let usdVal = wmaticPerDyst.times(getwMaticUsdRate())

  return usdVal
}

export function getPenUsdRate(): BigDecimal {
  let wmaticPerPen = findTokenPrice(dyst, PEN_ERC20, MATIC_ERC20)
  let usdVal = wmaticPerPen.times(getwMaticUsdRate())

  return usdVal
}

export function getPenDystUsdRate(): BigDecimal {
  let dystPerPen = findTokenPrice(dyst, PENDYST_ERC20, DYST_ERC20)

  return dystPerPen.times(getDystUsdRate())
}

// TODO: we can get eth price from chainlink
export function getwEthUsdRate(): BigDecimal {
  let usdcPerEth = findTokenPrice(quickSwap, WETH_ERC20, USDC_ERC20)

  return usdcPerEth
}

export function getClamUsdRate(block: BigInt): BigDecimal {
  let rate: BigDecimal

  if (block.gt(DYST_POOL_TRANSITION_BLOCK)) {
    rate = findTokenPrice(dyst, CLAM_ERC20, USDPLUS_ERC20)
  } else {
    rate = findTokenPrice(quickSwap, CLAM_ERC20, MAI_ERC20)
  }

  return rate
}

/**
Calculates the USD value of an LP investment position on Quickswap from the number of owned LP tokens and the pair address.
*/
export function getUniPairUSD(blockNumber: BigInt, lp_amount: BigInt, pair_address: Address): BigDecimal {
  let pair = UniswapV2Pair.bind(pair_address)
  let total_lp = pair.totalSupply()

  let token0 = ERC20.bind(pair.token0())
  let lp_token_0 = pair.getReserves().value0
  // let lp_token_1 = pair.getReserves().value1

  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))

  let usd_value = toDecimal(lp_token_0, token0.decimals()).times(findPrice(blockNumber, pair.token0()))
  let total_lp_usd = usd_value.times(BigDecimal.fromString('2'))
  let final_value = ownedLP.times(total_lp_usd)

  log.debug('Uni Pair USD Value: pair {} is {} owned with a total value of {}, final value {}', [
    pair_address.toHexString(),
    ownedLP.toString(),
    total_lp_usd.toString(),
    final_value.toString(),
  ])

  return final_value
}

/**
Calculates the USD value of an LP investment position on Arrakis from the number of owned LP tokens and the pair address.
*/
export function getArrakisPairUSD(blockNumber: BigInt, lp_amount: BigInt, pair_address: Address): BigDecimal {
  let pair = ArrakisVault.bind(pair_address)
  let total_lp = pair.totalSupply()

  let token0 = ERC20.bind(pair.token0())
  let token1 = ERC20.bind(pair.token1())

  let underlying = pair.getUnderlyingBalances()
  let lp_token_0 = underlying.value0
  let lp_token_1 = underlying.value1

  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))

  let usd_value_0 = toDecimal(lp_token_0, token0.decimals()).times(findPrice(blockNumber, pair.token0()))
  let usd_value_1 = toDecimal(lp_token_1, token1.decimals()).times(findPrice(blockNumber, pair.token1()))

  let totalUsd = usd_value_0.plus(usd_value_1)

  let final_value = ownedLP.times(totalUsd)

  log.debug('Arrakis Pair USD Value: pair {} is {} owned with a total value of {}, final value {}', [
    pair_address.toHexString(),
    ownedLP.toString(),
    totalUsd.toString(),
    final_value.toString(),
  ])

  return final_value
}
/**
Calculates the USD value of an LP investment position on Dystopia from the number of owned LP tokens and the pair address.
*/
export function getDystPairUSD(blockNumber: BigInt, lp_amount: BigInt, pair_address: Address): BigDecimal {
  if (lp_amount == BigInt.zero()) return BigDecimal.zero()
  let pair = DystPair.bind(pair_address)

  let token0 = ERC20.bind(pair.token0())
  let token1 = ERC20.bind(pair.token1())

  //get percentage of owned LP
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value0
  let lp_token_1 = pair.getReserves().value1
  let ownedLP = toDecimal(lp_amount, 18)

  if (ownedLP.gt(BigDecimal.zero()) && total_lp.gt(BigInt.zero())) ownedLP = ownedLP.div(toDecimal(total_lp, 18))

  //get total pool usd value
  let usd_value_token0 = toDecimal(lp_token_0, token0.decimals()).times(findPrice(blockNumber, pair.token0()))
  let usd_value_token1 = toDecimal(lp_token_1, token1.decimals()).times(findPrice(blockNumber, pair.token1()))
  let total_lp_usd = usd_value_token0.plus(usd_value_token1)

  return ownedLP.times(total_lp_usd)
}

export enum ReserveToken {
  TokenZero,
  TokenOne,
}

/**
Returns the USD value of one side of the reserves of a liquidity pool (proportional to the provided owned LP amount)
* @param ReserveToken Determines whether to return the value of `token0` or `token1` from the LP
*/
export function getDystPairHalfReserveUSD(
  blockNumber: BigInt,
  lp_amount: BigInt,
  pair_address: Address,
  reserve: ReserveToken,
): BigDecimal {
  if (lp_amount == BigInt.zero()) return BigDecimal.zero()
  let pair = DystPair.bind(pair_address)

  let token0 = ERC20.bind(pair.token0())
  let token1 = ERC20.bind(pair.token1())

  //get percentage of owned LP
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value0
  let lp_token_1 = pair.getReserves().value1
  let ownedLP = toDecimal(lp_amount, 18)

  if (ownedLP.gt(BigDecimal.zero()) && total_lp.gt(BigInt.zero())) ownedLP = ownedLP.div(toDecimal(total_lp, 18))

  //get half pool usd value
  if (reserve == ReserveToken.TokenZero) {
    let usd_value_token0 = toDecimal(lp_token_0, token0.decimals()).times(findPrice(blockNumber, pair.token0()))
    return ownedLP.times(usd_value_token0)
  }

  let usd_value_token1 = toDecimal(lp_token_1, token1.decimals()).times(findPrice(blockNumber, pair.token1()))
  return ownedLP.times(usd_value_token1)
}

export function findPrice(blockNumber: BigInt, address: Address): BigDecimal {
  if (address == CLAM_ERC20) return getClamUsdRate(blockNumber)
  if (address == QI_ERC20 || address == OCQI_CONTRACT) return getQiUsdRate()
  if (address == TETU_QI_ERC20) return getTetuQiUsdRate(blockNumber)
  if (address == MATIC_ERC20) return getwMaticUsdRate()
  if (address == DYST_ERC20) return getDystUsdRate()
  if (address == PEN_ERC20) return getPenUsdRate()
  if (address == WETH_ERC20) return getwEthUsdRate()
  if (address == PENDYST_ERC20) return getPenDystUsdRate()
  if (address == STMATIC_ERC20) return getStMaticUsdRate()
  if (address == LDO_ERC20) return getLdoUsdRate()
  if (address == MAI_ERC20) return getMaiUsdRate()
  if (address == DAI_ERC20) return getDaiUsdRate()
  if (address == USDC_ERC20) return getDaiUsdRate()
  if (address == FRAX_ERC20 || address == USDPLUS_ERC20 || address == TUSD_ERC20)
    //TODO: Find real price
    return BigDecimal.fromString('1')

  log.warning('Attempted to find price of unknown token address {}', [address.toHexString()])
  return BigDecimal.zero()
}
