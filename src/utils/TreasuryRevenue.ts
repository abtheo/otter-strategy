import { toDecimal } from './Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from './Dates'
import { TreasuryRevenue, Harvest, Transfer, Transaction, ClaimReward } from '../../generated/schema'
import { getClamUsdRate, getDystUsdRate, getPenDystUsdRate, getPenUsdRate, getQiUsdRate } from '../utils/Price'

export function loadOrCreateTreasuryRevenue(timestamp: BigInt): TreasuryRevenue {
  let ts = dayFromTimestamp(timestamp)

  let treasuryRevenue = TreasuryRevenue.load(ts)
  if (treasuryRevenue == null) {
    treasuryRevenue = new TreasuryRevenue(ts)
    treasuryRevenue.timestamp = timestamp
    treasuryRevenue.save()
  }
  return treasuryRevenue as TreasuryRevenue
}

export function setTreasuryRevenueTotals(revenue: TreasuryRevenue): TreasuryRevenue {
  revenue.totalRevenueClamAmount = revenue.qiClamAmount
    .plus(revenue.ottopiaClamAmount)
    .plus(revenue.dystClamAmount)
    .plus(revenue.penDystClamAmount)
    .plus(revenue.penClamAmount)
    .plus(revenue.ldoClamAmount)
    .plus(revenue.usdPlusClamAmount)
    .plus(revenue.daiClamAmount)
    .plus(revenue.kncClamAmount)
    .plus(revenue.usdcClamAmount)
    .plus(revenue.maiClamAmount)
    .plus(revenue.maticClamAmount)

  revenue.totalRevenueMarketValue = revenue.qiMarketValue
    .plus(revenue.ottopiaMarketValue)
    .plus(revenue.dystMarketValue)
    .plus(revenue.penDystMarketValue)
    .plus(revenue.penMarketValue)
    .plus(revenue.ldoMarketValue)
    .plus(revenue.usdPlusMarketValue)
    .plus(revenue.daiMarketValue)
    .plus(revenue.kncMarketValue)
    .plus(revenue.usdcMarketValue)
    .plus(revenue.maiMarketValue)
    .plus(revenue.maticMarketValue)

  return revenue
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

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimMaticReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimMaticReward event, txid: {}, maticMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.maticClamAmount = treasuryRevenue.maticClamAmount.plus(clamAmount)
  treasuryRevenue.maticMarketValue = treasuryRevenue.maticMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimQiReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimQiReward event, txid: {}, qiMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.qiClamAmount = treasuryRevenue.qiClamAmount.plus(clamAmount)
  treasuryRevenue.qiMarketValue = treasuryRevenue.qiMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimUsdplusReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimRewardUsdPlus event, txid: {}, usdPlusMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.usdPlusClamAmount = treasuryRevenue.usdPlusClamAmount.plus(clamAmount)
  treasuryRevenue.usdPlusMarketValue = treasuryRevenue.usdPlusMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimUsdcReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimRewardUsdc event, txid: {}, usdcMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.usdcClamAmount = treasuryRevenue.usdcClamAmount.plus(clamAmount)
  treasuryRevenue.usdcMarketValue = treasuryRevenue.usdcMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimMaiReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimRewardMai event, txid: {}, maiMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.maiClamAmount = treasuryRevenue.maiClamAmount.plus(clamAmount)
  treasuryRevenue.maiMarketValue = treasuryRevenue.maiMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimDaiReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimRewardDai event, txid: {}, DaiMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.daiClamAmount = treasuryRevenue.daiClamAmount.plus(clamAmount)
  treasuryRevenue.daiMarketValue = treasuryRevenue.daiMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimLdoReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimRewardLdo event, txid: {}, ldoMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.ldoClamAmount = treasuryRevenue.ldoClamAmount.plus(clamAmount)
  treasuryRevenue.ldoMarketValue = treasuryRevenue.ldoMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueClaimKncReward(block: BigInt, claim: ClaimReward): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(claim.timestamp)

  let clamAmount = claim.amountUsd.div(getClamUsdRate(block))
  log.debug('ClaimRewardKnc event, txid: {}, kncMarketValue {}, clamAmount {}', [
    claim.id,
    claim.amountUsd.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.kncClamAmount = treasuryRevenue.kncClamAmount.plus(clamAmount)
  treasuryRevenue.kncMarketValue = treasuryRevenue.kncMarketValue.plus(claim.amountUsd)

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

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

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

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

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

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

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

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

  treasuryRevenue = setTreasuryRevenueTotals(treasuryRevenue)

  treasuryRevenue.save()
}
