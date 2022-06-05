import {
  UNI_CLAM_MAI_PAIR,
  UNI_MAI_USDC_PAIR,
  USDC_MATIC_AGGREGATOR,
  UNI_QI_WMATIC_PAIR,
  UNI_QUICK_WMATIC_PAIR,
  UNI_WETH_USDC_PAIR,
  DYSTOPIA_PAIR_WMATIC_DYST,
  MATIC_ERC20_CONTRACT,
  DYST_ERC20,
  FRAX_ERC20_CONTRACT,
  USDPLUS_ERC20_CONTRACT,
  MAI_ERC20_CONTRACT,
  USDC_ERC20_CONTRACT,
  CLAM_ERC20_CONTRACT,
} from './Constants'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/OtterTreasury/UniswapV2Pair'
import { AggregatorV3InterfaceABI } from '../../generated/OtterTreasury/AggregatorV3InterfaceABI'
import { toDecimal } from './Decimals'
import { DystPair } from '../../generated/Dyst/DystPair'
import { ERC20 } from '../../generated/OtterTreasury/ERC20'

let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')

export function getwMaticUsdRate(): BigDecimal {
  let pair = AggregatorV3InterfaceABI.bind(Address.fromString(USDC_MATIC_AGGREGATOR))
  let wmaticPrice = pair.latestRoundData()
  return toDecimal(wmaticPrice.value1, 8)
}

export function getQiUsdRate(): BigDecimal {
  let lp = UniswapV2Pair.bind(Address.fromString(UNI_QI_WMATIC_PAIR))
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

export function getDystUsdRate(): BigDecimal {
  let lp = DystPair.bind(Address.fromString(DYSTOPIA_PAIR_WMATIC_DYST))
  let wmatic = toDecimal(lp.getReserves().value0, 18)
  let dyst = toDecimal(lp.getReserves().value1, 18)
  let wmaticPerQi = wmatic.div(dyst)
  let usdPerQi = wmaticPerQi.times(getwMaticUsdRate())
  log.debug('wmatic = {}, dyst = {}, 1 dyst = {} wmatic = {} USD', [
    wmatic.toString(),
    dyst.toString(),
    wmaticPerQi.toString(),
    usdPerQi.toString(),
  ])
  return usdPerQi
}

export function getQuickUsdRate(): BigDecimal {
  let lp = UniswapV2Pair.bind(Address.fromString(UNI_QUICK_WMATIC_PAIR))
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
  let pair = UniswapV2Pair.bind(Address.fromString(UNI_WETH_USDC_PAIR))

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
  let pair = UniswapV2Pair.bind(Address.fromString(UNI_CLAM_MAI_PAIR))

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

//(slp_treasury/slp_supply)*(2*sqrt(lp_dai * lp_ohm))
export function getDiscountedPairUSD(lp_amount: BigInt, pair_address: string): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(pair_address))

  let total_lp = pair.totalSupply()
  let lp_token_1 = toDecimal(pair.getReserves().value1, 9)
  let lp_token_2 = toDecimal(pair.getReserves().value0, 18)
  let kLast = lp_token_1.times(lp_token_2).truncate(0).digits

  let part1 = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let two = BigInt.fromI32(2)

  let sqrt = kLast.sqrt()
  let part2 = toDecimal(two.times(sqrt), 0)
  let result = part1.times(part2)
  return result
}

export function getPairUSD(lp_amount: BigInt, pair_address: string): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(pair_address))
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value1
  let lp_token_1 = pair.getReserves().value0
  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let clam_value = toDecimal(lp_token_0, 9).times(getClamUsdRate())
  let total_lp_usd = clam_value.plus(toDecimal(lp_token_1, 18))

  return ownedLP.times(total_lp_usd)
}

export function getDystPairUSD(lp_amount: BigInt, pair_address: string): BigDecimal {
  if (lp_amount == BigInt.fromString('0')) return BigDecimal.fromString('0')
  let pair = DystPair.bind(Address.fromString(pair_address))

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
  let usd_value_token1 = toDecimal(lp_token_1, token1.decimals()).times(findPrice(pair.token0()))
  let total_lp_usd = usd_value_token0.plus(usd_value_token1)

  return ownedLP.times(total_lp_usd)
}

function findPrice(address: Address): BigDecimal {
  if (address.toHexString() == CLAM_ERC20_CONTRACT.toLowerCase()) return getClamUsdRate()
  if (address.toHexString() == MATIC_ERC20_CONTRACT.toLowerCase()) return getwMaticUsdRate()
  if (address.toHexString() == DYST_ERC20.toLowerCase()) return getDystUsdRate()
  if (
    address.toHexString() == FRAX_ERC20_CONTRACT.toLowerCase() ||
    address.toHexString() == MAI_ERC20_CONTRACT.toLowerCase() ||
    address.toHexString() == USDPLUS_ERC20_CONTRACT.toLowerCase() ||
    address.toHexString() == USDC_ERC20_CONTRACT.toLowerCase()
  )
    return BigDecimal.fromString('1')

  return BigDecimal.zero()
}

export function getPairWMATIC(lp_amount: BigInt, pair_adress: string): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(pair_adress))
  let total_lp = pair.totalSupply()
  let lp_token_0 = pair.getReserves().value1
  let lp_token_1 = pair.getReserves().value0
  let ownedLP = toDecimal(lp_amount, 18).div(toDecimal(total_lp, 18))
  let clam_value = toDecimal(lp_token_0, 9).times(getClamUsdRate())
  let matic_value = toDecimal(lp_token_1, 18).times(getwMaticUsdRate())
  let total_lp_usd = clam_value.plus(matic_value)

  return ownedLP.times(total_lp_usd)
}

export function getwMATICMarketValue(balance: BigDecimal): BigDecimal {
  let usdPerwMATIC = getwMaticUsdRate()
  log.debug('1 wMATIC = {} USD', [usdPerwMATIC.toString()])

  let marketValue = balance.times(usdPerwMATIC)
  log.debug('wMATIC marketValue = {}', [marketValue.toString()])
  return marketValue
}

export function getwETHMarketValue(balance: BigDecimal): BigDecimal {
  let usdPerwETH = getwEthUsdRate()
  log.debug('1 wETH = {} USD', [usdPerwETH.toString()])

  let marketValue = balance.times(usdPerwETH)
  log.debug('wETH marketValue = {}', [marketValue.toString()])
  return marketValue
}

export function getDystMarketValue(balance: BigDecimal): BigDecimal {
  let usdPerDYST = getDystUsdRate()
  log.debug('1 DYST = {} USD', [usdPerDYST.toString()])

  let marketValue = balance.times(usdPerDYST)
  log.debug('DYST marketValue = {}', [marketValue.toString()])
  return marketValue
}
