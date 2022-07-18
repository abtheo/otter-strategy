import { toDecimal } from './Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from './Dates'
import { TreasuryRevenue, Harvest, Transfer, Buyback, TotalBuybacks, RevenueTracker } from '../../generated/schema'
import {
  getClamUsdRate,
  getDystUsdRate,
  getPenUsdRate,
  getQiUsdRate,
  getwEthUsdRate,
  getwMaticUsdRate,
} from '../utils/Price'
import {
  QI_ERC20,
  DAI_ERC20,
  MAI_ERC20,
  FRAX_ERC20,
  MATIC_ERC20,
  WETH_ERC20,
  TREASURY_ADDRESS,
  UNI_QI_WMATIC_PAIR,
  OTTER_QI_LOCKER,
} from './Constants'
import { UniswapV2Pair } from '../../generated/OtterQiLocker/UniswapV2Pair'
import { ERC20 } from '../../generated/OtterQiLocker/ERC20'

export function loadOrCreateTreasuryRevenue(timestamp: BigInt): TreasuryRevenue {
  let ts = dayFromTimestamp(timestamp)

  let treasuryRevenue = TreasuryRevenue.load(ts)
  if (treasuryRevenue == null) {
    treasuryRevenue = new TreasuryRevenue(ts)
    treasuryRevenue.timestamp = timestamp
    treasuryRevenue.qiClamAmount = BigDecimal.zero()
    treasuryRevenue.qiMarketValue = BigDecimal.zero()
    treasuryRevenue.dystClamAmount = BigDecimal.zero()
    treasuryRevenue.dystMarketValue = BigDecimal.zero()
    treasuryRevenue.penClamAmount = BigDecimal.zero()
    treasuryRevenue.penMarketValue = BigDecimal.zero()
    treasuryRevenue.totalRevenueMarketValue = BigDecimal.zero()
    treasuryRevenue.totalRevenueClamAmount = BigDecimal.zero()
    treasuryRevenue.buybackClamAmount = BigDecimal.zero()
    treasuryRevenue.buybackMarketValue = BigDecimal.zero()
    treasuryRevenue.cumulativeBuybackClamAmount = BigDecimal.zero()
    treasuryRevenue.cumulativeBuybackMarketValue = BigDecimal.zero()

    let cumulativeBuybacks = loadOrCreateTotalBuybacksSingleton()
    treasuryRevenue.cumulativeBuybackClamAmount = cumulativeBuybacks.boughtClam
    treasuryRevenue.cumulativeBuybackMarketValue = cumulativeBuybacks.boughtMarketValue

    treasuryRevenue.save()
  }
  return treasuryRevenue as TreasuryRevenue
}

export function updateTreasuryRevenueHarvest(harvest: Harvest): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(harvest.timestamp)
  let qi = toDecimal(harvest.amount, 18)
  let qiMarketValue = getQiUsdRate().times(qi)
  let clamAmount = qiMarketValue.div(getClamUsdRate())
  log.debug('HarvestEvent, txid: {}, qiMarketValue {}, clamAmount {}', [
    harvest.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.qiClamAmount = treasuryRevenue.qiClamAmount.plus(clamAmount)
  treasuryRevenue.qiMarketValue = treasuryRevenue.qiMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)

  treasuryRevenue.save()
}

/* 
Whenever one of the (trackable) Qi contracts is harvested,
calculate the difference in our Qi position since the last timestep
*/
export function updateTreasuryRevenueQiChange(harvest: Harvest): void {
  //get all Qi balances
  let qi = ERC20.bind(QI_ERC20).balanceOf(TREASURY_ADDRESS)
  let ocqiLocker = ERC20.bind(OTTER_QI_LOCKER).balanceOf(TREASURY_ADDRESS)
  let qiMaticLp = UniswapV2Pair.bind(UNI_QI_WMATIC_PAIR)
  let qiMaticLpTokens = qiMaticLp.balanceOf(TREASURY_ADDRESS)
  let qiTotal = qi.plus(ocqiLocker)

  //set current metrics for next time
  let revenueTracker = loadOrCreateRevenueTracker(harvest.timestamp)
  revenueTracker.qiAmount = qiTotal
  revenueTracker.qiMaticLpTokens = qiMaticLpTokens
  revenueTracker.save()

  //find difference from previous revenue tracker
  let previousRevenueTracker = loadOrCreateRevenueTracker(harvest.timestamp.minus(BigInt.fromString('86400')))
  let qiDiff = qiTotal.minus(previousRevenueTracker.qiAmount)
  //things get weird if we move Qi into the liquidity pool...
  if (qiMaticLpTokens.gt(previousRevenueTracker.qiMaticLpTokens)) {
    let newLp = qiMaticLpTokens.minus(previousRevenueTracker.qiMaticLpTokens)
    let newLpQiAmount = newLp
      .div(qiMaticLp.totalSupply())
      .times(qiMaticLp.getReserves().value1)
      .times(BigInt.fromString('2'))
    qiDiff.plus(newLpQiAmount)
  }

  //update TreasuryRevenue
  let treasuryRevenue = loadOrCreateTreasuryRevenue(harvest.timestamp)
  let qiMarketValue = getQiUsdRate().times(toDecimal(qiDiff, 18))
  let clamAmount = qiMarketValue.div(getClamUsdRate())

  log.debug('Qi harvest event, txid: {}, qiMarketValue {}, clamAmount: {}', [
    harvest.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.qiClamAmount = treasuryRevenue.qiClamAmount.plus(clamAmount)
  treasuryRevenue.qiMarketValue = treasuryRevenue.qiMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueDystTransfer(transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let dystMarketValue = getDystUsdRate().times(toDecimal(transfer.value, 18))
  let clamAmount = dystMarketValue.div(getClamUsdRate())

  log.debug('TransferEvent, txid: {}, dystMarketValue {}, clamAmount: {}', [
    transfer.id,
    dystMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.dystClamAmount = treasuryRevenue.dystClamAmount.plus(clamAmount)
  treasuryRevenue.dystMarketValue = treasuryRevenue.dystMarketValue.plus(dystMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(dystMarketValue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenuePenTransfer(transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let penMarketValue = getPenUsdRate().times(toDecimal(transfer.value, 18))
  let clamAmount = penMarketValue.div(getClamUsdRate())

  log.debug('TransferEvent, txid: {}, penMarketValue {}, clamAmount: {}', [
    transfer.id,
    penMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.penClamAmount = treasuryRevenue.penClamAmount.plus(clamAmount)
  treasuryRevenue.penMarketValue = treasuryRevenue.penMarketValue.plus(penMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(penMarketValue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueBuyback(buyback: Buyback): void {
  log.debug('BuybackEvent, txid: {}, token: ', [buyback.id, buyback.token.toHexString()])
  let treasuryRevenue = loadOrCreateTreasuryRevenue(buyback.timestamp)
  let marketValue = BigDecimal.zero()
  let clamAmountDec = buyback.clamAmount.divDecimal(BigDecimal.fromString('1e9'))

  if (buyback.token == QI_ERC20) {
    marketValue = getQiUsdRate().times(toDecimal(buyback.tokenAmount, 18))
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }
  if (buyback.token == MATIC_ERC20) {
    marketValue = getwMaticUsdRate().times(toDecimal(buyback.tokenAmount, 18))
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }

  if (buyback.token == WETH_ERC20) {
    marketValue = getwEthUsdRate().times(buyback.tokenAmount.toBigDecimal())
    log.debug('BuybackEvent using wETH, txid: {}', [buyback.id])
  }
  //stablecoins (18 decimals)
  if (buyback.token == DAI_ERC20 || buyback.token == FRAX_ERC20 || buyback.token == MAI_ERC20) {
    marketValue = toDecimal(buyback.tokenAmount, 18)
    log.debug('BuybackEvent using Stablecoins, txid: {}', [buyback.id])
  }
  //If token is not tracked or buyback has no value, skip
  if (marketValue == BigDecimal.zero()) return

  treasuryRevenue.buybackMarketValue = treasuryRevenue.buybackMarketValue.plus(marketValue)
  treasuryRevenue.buybackClamAmount = treasuryRevenue.buybackClamAmount.plus(clamAmountDec)

  //Aggregate all history with singleton pattern
  let cumulativeBuybacks = loadOrCreateTotalBuybacksSingleton()
  cumulativeBuybacks.boughtClam = cumulativeBuybacks.boughtClam.plus(clamAmountDec)
  cumulativeBuybacks.boughtMarketValue = cumulativeBuybacks.boughtMarketValue.plus(marketValue)
  cumulativeBuybacks.save()

  treasuryRevenue.cumulativeBuybackClamAmount = cumulativeBuybacks.boughtClam
  treasuryRevenue.cumulativeBuybackMarketValue = cumulativeBuybacks.boughtMarketValue

  treasuryRevenue.save()
}

export function loadOrCreateTotalBuybacksSingleton(): TotalBuybacks {
  let total = TotalBuybacks.load('1')
  if (total == null) {
    total = new TotalBuybacks('1')
    total.boughtClam = BigDecimal.zero()
    total.boughtMarketValue = BigDecimal.zero()
  }
  return total
}

export function loadOrCreateRevenueTracker(timestamp: BigInt): RevenueTracker {
  let ts = dayFromTimestamp(timestamp)

  let revenue = RevenueTracker.load(ts)
  if (revenue == null) {
    revenue = new RevenueTracker(ts)
    revenue.qiAmount = BigInt.zero()
    revenue.qiMaticLpTokens = BigInt.zero()
  }
  return revenue
}
