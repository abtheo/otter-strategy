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
} from './Constants'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/StakedOtterClamERC20V2/UniswapV2Pair'
import { AggregatorV3InterfaceABI } from '../../generated/StakedOtterClamERC20V2/AggregatorV3InterfaceABI'
import { toDecimal } from './Decimals'
import { DystPair } from '../../generated/Dyst/DystPair'
import { ERC20 } from '../../generated/StakedOtterClamERC20V2/ERC20'

let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')

export function getwMaticUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(USDC_MATIC_AGGREGATOR)
  let wmaticPrice = pair.latestRoundData()
  return toDecimal(wmaticPrice.value1, 8)
}

export function getQiUsdRate(): BigDecimal {
  let lp = UniswapV2Pair.bind(UNI_QI_WMATIC_PAIR)
  let wmatic = toDecimal(lp.getReserves().value0, 18)
  let qi = toDecimal(lp.getReserves().value1, 18)
  let wmaticPerQi = wmatic.div(qi)
  let usdPerQi = wmaticPerQi.times(getwMaticUsdRate())
  log.debug('wmatic = {}, qi = {}, 1 qi = {} wmatic = {} USD', [
    wmatic.toString(),
    qi.toString(),
    wmaticPerQi.toString(),
    usdPerQi.toString(),
  ])
  return usdPerQi
}

/*Pools on Dystopia do not use Uniswap xy=k formula */
export function getDystUsdRate(): BigDecimal {
  let lp = DystPair.bind(DYSTOPIA_PAIR_WMATIC_DYST)
  let hasMaticAmount = lp.try_getAmountOut(BigInt.fromString('1000000000000000000'), DYST_ERC20)
  if (hasMaticAmount.reverted) return BigDecimal.zero()

  let amountMatic = hasMaticAmount.value.divDecimal(BigDecimal.fromString('1e18'))
  let usdVal = amountMatic.times(getwMaticUsdRate())

  log.debug('1 DYST = {} MATIC = {} USD', [amountMatic.toString(), usdVal.toString()])

  return usdVal
}

/*Pools on Dystopia do not use Uniswap xy=k formula */
export function getPenUsdRate(): BigDecimal {
  let lp = DystPair.bind(DYSTOPIA_PAIR_WMATIC_PEN)
  let hasMaticAmount = lp.try_getAmountOut(BigInt.fromString('1000000000000000000'), PEN_ERC20)
  if (hasMaticAmount.reverted) return BigDecimal.zero()

  let amountMatic = hasMaticAmount.value.divDecimal(BigDecimal.fromString('1e18'))
  let usdVal = amountMatic.times(getwMaticUsdRate())

  log.debug('1 PEN = {} MATIC = {} USD', [amountMatic.toString(), usdVal.toString()])

  return usdVal
}

/*Pools on Dystopia do not use Uniswap xy=k formula */
export function getPenDystUsdRate(): BigDecimal {
  let lp = DystPair.bind(DYSTOPIA_PAIR_PENDYST_DYST)
  let hasDystAmount = lp.try_getAmountOut(BigInt.fromString('1000000000000000000'), PENDYST_ERC20)
  if (hasDystAmount.reverted) return BigDecimal.zero()

  let amountDyst = hasDystAmount.value.divDecimal(BigDecimal.fromString('1e18'))

  log.debug('1 penDYST = {} DYST', [amountDyst.toString()])

  return amountDyst.times(getDystUsdRate())
}

export function getQuickUsdRate(): BigDecimal {
  let lp = UniswapV2Pair.bind(UNI_QUICK_WMATIC_PAIR)
  let reserves = lp.getReserves()
  let wmatic = toDecimal(reserves.value0, 18)
  let quick = toDecimal(reserves.value1, 18)
  let wmaticPerQuick = wmatic.div(quick)
  let usdPerQuick = wmaticPerQuick.times(getwMaticUsdRate())
  log.debug('wmatic = {}, quick = {}, 1 quick = {} wmatic = {} USD', [
    wmatic.toString(),
    quick.toString(),
    wmaticPerQuick.toString(),
    usdPerQuick.toString(),
  ])
  return usdPerQuick
}

export function getwEthUsdRate(): BigDecimal {
  let pair = UniswapV2Pair.bind(UNI_WETH_USDC_PAIR)

  let reserves = pair.getReserves()
  let weth = reserves.value1.toBigDecimal()
  let usdc = reserves.value0.toBigDecimal()
  log.debug('pair reserve0 {}, reserve1 {}', [weth.toString(), usdc.toString()])

  if (weth.equals(BigDecimal.zero())) {
    log.debug('getwethRate div {}', [weth.toString()])
    return BigDecimal.zero()
  }

  let wethRate = usdc.div(BigDecimal.fromString('1e6')).div(weth)
  log.debug('weth rate {}', [wethRate.toString()])

  return wethRate
}

export function getClamUsdRate(): BigDecimal {
  let pair = UniswapV2Pair.bind(UNI_CLAM_MAI_PAIR)

  let reserves = pair.getReserves()
  let clam = reserves.value1.toBigDecimal()
  let mai = reserves.value0.toBigDecimal()
  log.debug('pair reserve0 {}, reserve1 {}', [clam.toString(), mai.toString()])

  if (clam.equals(BigDecimal.zero()) || mai.equals(BigDecimal.zero())) {
    log.debug('getCLAMUSDRate div {}', [clam.toString()])
    return BigDecimal.zero()
  }

  let clamRate = mai.div(clam).div(BIG_DECIMAL_1E9)
  log.debug('CLAM rate {}', [clamRate.toString()])

  return clamRate
}

export function getPairUSD(lp_amount: BigInt, pair_address: Address): BigDecimal {
  let pair = UniswapV2Pair.bind(pair_address)
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value1
  let lp_token_1 = pair.getReserves().value0
  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let clam_value = toDecimal(lp_token_0, 9).times(getClamUsdRate())
  let total_lp_usd = clam_value.plus(toDecimal(lp_token_1, 18))

  return ownedLP.times(total_lp_usd)
}

export function getDystPairUSD(lp_amount: BigInt, pair_address: Address): BigDecimal {
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
  let usd_value_token0 = toDecimal(lp_token_0, token0.decimals()).times(findPrice(pair.token0()))
  let usd_value_token1 = toDecimal(lp_token_1, token1.decimals()).times(findPrice(pair.token1()))
  let total_lp_usd = usd_value_token0.plus(usd_value_token1)

  return ownedLP.times(total_lp_usd)
}

export function findPrice(address: Address): BigDecimal {
  if (address == CLAM_ERC20) if (address == CLAM_ERC20) return getClamUsdRate()
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

export function getPairWMATIC(lp_amount: BigInt, pair_adress: Address): BigDecimal {
  let pair = UniswapV2Pair.bind(pair_adress)
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value1
  let lp_token_1 = pair.getReserves().value0
  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let clam_value = toDecimal(lp_token_0, 9).times(getClamUsdRate())
  let matic_value = toDecimal(lp_token_1, 18).times(getwMaticUsdRate())
  let total_lp_usd = clam_value.plus(matic_value)

  return ownedLP.times(total_lp_usd)
}
