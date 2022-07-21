import { toDecimal } from './Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from './Dates'
import { TreasuryRevenue, Harvest, Transfer, Transaction } from '../../generated/schema'
import { getClamUsdRate, getDystUsdRate, getPenDystUsdRate, getPenUsdRate, getQiUsdRate } from '../utils/Price'

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
    treasuryRevenue.save()
  }
  return treasuryRevenue as TreasuryRevenue
}

export function updateTreasuryRevenueHarvest(block: BigInt, harvest: Harvest): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(harvest.timestamp)
  let qi = toDecimal(harvest.amount, 18)
  let qiMarketValue = getQiUsdRate().times(qi)
  let clamAmount = qiMarketValue.div(getClamUsdRate(block))
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

export function updateTreasuryRevenueQiTransfer(block: BigInt, transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let qiMarketValue = getQiUsdRate().times(toDecimal(transfer.value, 18))
  let clamAmount = qiMarketValue.div(getClamUsdRate(block))

  log.debug('TransferEvent, txid: {}, qiMarketValue {}, clamAmount: {}', [
    transfer.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.qiClamAmount = treasuryRevenue.qiClamAmount.plus(clamAmount)
  treasuryRevenue.qiMarketValue = treasuryRevenue.qiMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)

  treasuryRevenue.save()
}
export function updateTreasuryRevenueDystRewardPaid(transaction: Transaction, amount: BigInt): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transaction.timestamp)

  let dystMarketValue = getDystUsdRate().times(toDecimal(amount, 18))
  let clamAmount = dystMarketValue.div(getClamUsdRate(transaction.blockNumber))

  log.debug('TransferEvent, txid: {}, dystMarketValue {}, clamAmount: {}', [
    transaction.id,
    dystMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.dystClamAmount = treasuryRevenue.dystClamAmount.plus(clamAmount)
  treasuryRevenue.dystMarketValue = treasuryRevenue.dystMarketValue.plus(dystMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(dystMarketValue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenuePenRewardPaid(transaction: Transaction, amount: BigInt): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transaction.timestamp)

  let penMarketValue = getPenUsdRate().times(toDecimal(amount, 18))
  let clamAmount = penMarketValue.div(getClamUsdRate(transaction.blockNumber))

  log.debug('TransferEvent, txid: {}, penAmt {}, penMarketValue {}, clamAmount: {}', [
    transaction.id,
    amount.toString(),
    penMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.penClamAmount = treasuryRevenue.penClamAmount.plus(clamAmount)
  treasuryRevenue.penMarketValue = treasuryRevenue.penMarketValue.plus(penMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(penMarketValue)

  treasuryRevenue.save()
}
export function updateTreasuryRevenuePenDystRewardPaid(transaction: Transaction, amount: BigInt): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transaction.timestamp)

  let penDystMarketValue = getPenDystUsdRate().times(toDecimal(amount, 18))
  let clamAmount = penDystMarketValue.div(getClamUsdRate(transaction.blockNumber))

  log.debug('TransferEvent, txid: {}, penAmt {}, penMarketValue {}, clamAmount: {}', [
    transaction.id,
    amount.toString(),
    penDystMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.penDystClamAmount = treasuryRevenue.penClamAmount.plus(clamAmount)
  treasuryRevenue.penDystMarketValue = treasuryRevenue.penMarketValue.plus(penDystMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(penDystMarketValue)

  treasuryRevenue.save()
}
