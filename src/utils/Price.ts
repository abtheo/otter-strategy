import {
  UNI_CLAM_MAI_PAIR,
  USDC_MATIC_AGGREGATOR,
  UNI_QI_WMATIC_PAIR,
  UNI_QUICK_WMATIC_PAIR,
  UNI_WETH_USDC_PAIR,
  DYSTOPIA_PAIR_WMATIC_DYST,
  DYSTOPIA_PAIR_WMATIC_PEN,
  MATIC_ERC20,
  DYST_ERC20,
  FRAX_ERC20,
  USDPLUS_ERC20,
  MAI_ERC20,
  USDC_ERC20,
  CLAM_ERC20,
  PEN_ERC20,
  WETH_ERC20,
  DYSTOPIA_PAIR_PENDYST_DYST,
  PENDYST_ERC20,
  DQUICK_ERC20,
  QI_ERC20,
  OCQI_CONTRACT,
  QUICK_ERC20,
  DYST_POOL_TRANSITION_BLOCK,
} from './Constants'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/StakedOtterClamERC20V2/UniswapV2Pair'
import { AggregatorV3InterfaceABI } from '../../generated/StakedOtterClamERC20V2/AggregatorV3InterfaceABI'
import { toDecimal } from './Decimals'
import { DystPair } from '../../generated/Dyst/DystPair'
import { ERC20 } from '../../generated/StakedOtterClamERC20V2/ERC20'
import { dyst, quickSwap, Exchange } from './Exchange'

function findTokenPrice(exchange: Exchange, inTokenAddress: Address, outTokenAddress: Address): BigDecimal {
  let inToken = ERC20.bind(inTokenAddress)
  let outToken = ERC20.bind(outTokenAddress)
  let inDecimals = inToken.decimals()
  let outDecimals = outToken.decimals()
  let price = exchange.getAmountOut(BigInt.fromI64(<i64>Math.pow(10, inDecimals)), inTokenAddress, outTokenAddress)
  return toDecimal(price, outDecimals)
}

let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')

export function getwMaticUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(USDC_MATIC_AGGREGATOR)
  let wmaticPrice = pair.latestRoundData()
  return toDecimal(wmaticPrice.value1, 8)
}

export function getQiUsdRate(): BigDecimal {
  let wmaticPerQi = findTokenPrice(quickSwap, QI_ERC20, MATIC_ERC20)
  let usdPerQi = wmaticPerQi.times(getwMaticUsdRate())

  log.debug('1 qi = {} wmatic = {} USD', [
    wmaticPerQi.toString(),
    usdPerQi.toString(),
  ])

  return usdPerQi
}

export function getDystUsdRate(): BigDecimal {
  let wmaticPerDyst = findTokenPrice(dyst, DYST_ERC20, MATIC_ERC20)
  let usdVal = wmaticPerDyst.times(getwMaticUsdRate())

  log.debug('1 DYST = {} MATIC = {} USD', [wmaticPerDyst.toString(), usdVal.toString()])

  return usdVal
}

export function getPenUsdRate(): BigDecimal {
  let wmaticPerPen = findTokenPrice(dyst, PEN_ERC20, MATIC_ERC20)
  let usdVal = wmaticPerPen.times(getwMaticUsdRate())

  log.debug('1 PEN = {} MATIC = {} USD', [wmaticPerPen.toString(), usdVal.toString()])

  return usdVal
}

export function getPenDystUsdRate(): BigDecimal {
  let dystPerPen = findTokenPrice(dyst, PENDYST_ERC20, DYST_ERC20)

  log.debug('1 penDYST = {} DYST', [dystPerPen.toString()])

  return dystPerPen.times(getDystUsdRate())
}

export function getQuickUsdRate(): BigDecimal {
  let wmaticPerQuick = findTokenPrice(quickSwap, QUICK_ERC20, MATIC_ERC20)
  let usdPerQuick = wmaticPerQuick.times(getwMaticUsdRate())

  log.debug('1 quick = {} wmatic = {} USD', [
    wmaticPerQuick.toString(),
    usdPerQuick.toString(),
  ])

  return usdPerQuick
}

// TODO: we can get eth price from chainlink
export function getwEthUsdRate(): BigDecimal {
  let usdcPerEth = findTokenPrice(quickSwap, WETH_ERC20, USDC_ERC20)

  log.debug('weth rate {}', [usdcPerEth.toString()])

  return usdcPerEth
}

export function getClamUsdRate(block: BigInt): BigDecimal {
  let rate: BigDecimal

  if (block.gt(BigInt.fromI32(DYST_POOL_TRANSITION_BLOCK))) {
    rate = findTokenPrice(dyst, CLAM_ERC20, USDPLUS_ERC20)
  } else {
    rate = findTokenPrice(quickSwap, CLAM_ERC20, USDPLUS_ERC20)
  }

  log.debug('CLAM rate {}', [rate.toString()])

  return rate
}

export function getPairUSD(blockNumber: BigInt, lp_amount: BigInt, pair_address: Address): BigDecimal {
  let pair = UniswapV2Pair.bind(pair_address)
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value1
  let lp_token_1 = pair.getReserves().value0
  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let clam_value = toDecimal(lp_token_0, 9).times(getClamUsdRate(blockNumber))
  let total_lp_usd = clam_value.plus(toDecimal(lp_token_1, 18))

  return ownedLP.times(total_lp_usd)
}

export function getDystPairUSD(blockNumber: BigInt, lp_amount: BigInt, pair_address: Address): BigDecimal {
  if (lp_amount == BigInt.fromString('0')) return BigDecimal.zero()
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

export function findPrice(blockNumber: BigInt, address: Address): BigDecimal {
  if (address == CLAM_ERC20) if (address == CLAM_ERC20) return getClamUsdRate(blockNumber)
  if (address == QI_ERC20 || address == OCQI_CONTRACT) return getQiUsdRate()
  if (address == MATIC_ERC20) return getwMaticUsdRate()
  if (address == DYST_ERC20) return getDystUsdRate()
  if (address == PEN_ERC20) return getPenUsdRate()
  if (address == WETH_ERC20) return getwEthUsdRate()
  if (address == DQUICK_ERC20) return getQuickUsdRate()
  if (address == FRAX_ERC20 || address == MAI_ERC20 || address == USDPLUS_ERC20 || address == USDC_ERC20)
    return BigDecimal.fromString('1')

  log.warning('Attempted to find price of unknown token address {}', [address.toHexString()])
  return BigDecimal.zero()
}

export function getPairWMATIC(blockNumber: BigInt, lp_amount: BigInt, pair_adress: Address): BigDecimal {
  let pair = UniswapV2Pair.bind(pair_adress)
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value1
  let lp_token_1 = pair.getReserves().value0
  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let clam_value = toDecimal(lp_token_0, 9).times(getClamUsdRate(blockNumber))
  let matic_value = toDecimal(lp_token_1, 18).times(getwMaticUsdRate())
  let total_lp_usd = clam_value.plus(matic_value)

  return ownedLP.times(total_lp_usd)
}
