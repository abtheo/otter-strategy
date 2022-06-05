import { toDecimal } from './Decimals'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from './Dates'
import {
  TreasuryRevenue,
  Transaction,
  Harvest,
  Transfer,
  Buyback,
  TotalBuybacks,
  TotalBribeRewards,
} from '../../generated/schema'
import { getQiMarketValue } from '../utils/Price'
import {
  QI_ERC20_CONTRACT,
  DAI_ERC20_CONTRACT,
  MAI_ERC20_CONTRACT,
  FRAX_ERC20_CONTRACT,
  MATIC_ERC20_CONTRACT,
  WETH_CONTRACT,
} from './Constants'
import { getwMATICMarketValue, getClamUsdRate, getwETHMarketValue, getDystMarketValue } from './Price'
import { addressEqualsString } from './'

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
    treasuryRevenue.totalRevenueMarketValue = BigDecimal.zero()
    treasuryRevenue.totalRevenueClamAmount = BigDecimal.zero()
    treasuryRevenue.buybackClamAmount = BigDecimal.zero()
    treasuryRevenue.buybackMarketValue = BigDecimal.zero()
    treasuryRevenue.cumulativeBuybackClamAmount = BigDecimal.zero()
    treasuryRevenue.cumulativeBuybackMarketValue = BigDecimal.zero()
    treasuryRevenue.yieldClamAmount = BigDecimal.zero()
    treasuryRevenue.yieldMarketValue = BigDecimal.zero()

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
  let qiMarketValue = getQiMarketValue(qi)
  let clamAmount = qiMarketValue.div(getClamUsdRate())
  log.debug('HarvestEvent, txid: {}, qiMarketValue {}, clamAmount {}', [
    harvest.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.qiClamAmount = treasuryRevenue.qiClamAmount.plus(clamAmount)
  treasuryRevenue.qiMarketValue = treasuryRevenue.qiMarketValue.plus(qiMarketValue)

  treasuryRevenue.yieldClamAmount = treasuryRevenue.yieldClamAmount.plus(clamAmount)
  treasuryRevenue.yieldMarketValue = treasuryRevenue.yieldMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)

  treasuryRevenue.save()
}
export function updateTreasuryRevenueQiTransfer(transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let qiMarketValue = getQiMarketValue(toDecimal(transfer.value, 18))
  let clamAmount = qiMarketValue.div(getClamUsdRate())

  log.debug('TransferEvent, txid: {}, qiMarketValue {}, clamAmount: {}', [
    transfer.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.qiClamAmount = treasuryRevenue.qiClamAmount.plus(clamAmount)
  treasuryRevenue.qiMarketValue = treasuryRevenue.qiMarketValue.plus(qiMarketValue)

  treasuryRevenue.yieldClamAmount = treasuryRevenue.yieldClamAmount.plus(clamAmount)
  treasuryRevenue.yieldMarketValue = treasuryRevenue.yieldMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueDystTransfer(transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let dystMarketValue = getDystMarketValue(toDecimal(transfer.value, 18))
  let clamAmount = dystMarketValue.div(getClamUsdRate())

  log.debug('TransferEvent, txid: {}, dystMarketValue {}, clamAmount: {}', [
    transfer.id,
    dystMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.dystClamAmount = treasuryRevenue.dystClamAmount.plus(clamAmount)
  treasuryRevenue.dystMarketValue = treasuryRevenue.dystMarketValue.plus(dystMarketValue)

  treasuryRevenue.yieldClamAmount = treasuryRevenue.yieldClamAmount.plus(clamAmount)
  treasuryRevenue.yieldMarketValue = treasuryRevenue.yieldMarketValue.plus(dystMarketValue)

  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)
  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(dystMarketValue)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueBuyback(buyback: Buyback): void {
  log.debug('BuybackEvent, txid: {}, token: ', [buyback.id, buyback.token.toHexString()])
  let treasuryRevenue = loadOrCreateTreasuryRevenue(buyback.timestamp)
  let marketValue = BigDecimal.zero()
  let clamAmountDec = buyback.clamAmount.divDecimal(BigDecimal.fromString('1e9'))

  if (addressEqualsString(buyback.token, QI_ERC20_CONTRACT)) {
    marketValue = getQiMarketValue(toDecimal(buyback.tokenAmount, 18))
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }
  if (addressEqualsString(buyback.token, MATIC_ERC20_CONTRACT)) {
    marketValue = getwMATICMarketValue(toDecimal(buyback.tokenAmount, 18))
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }

  if (addressEqualsString(buyback.token, WETH_CONTRACT)) {
    marketValue = getwETHMarketValue(buyback.tokenAmount.toBigDecimal())
    log.debug('BuybackEvent using wETH, txid: {}', [buyback.id])
  }
  //stablecoins (18 decimals)
  if (
    addressEqualsString(buyback.token, DAI_ERC20_CONTRACT) ||
    addressEqualsString(buyback.token, FRAX_ERC20_CONTRACT) ||
    addressEqualsString(buyback.token, MAI_ERC20_CONTRACT)
  ) {
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
export function loadOrCreateTotalBribeRewardsSingleton(): TotalBribeRewards {
  let total = TotalBribeRewards.load('1')
  if (total == null) {
    total = new TotalBribeRewards('1')
    total.qiBribeRewardsMarketValue = BigDecimal.zero()
    total.polygonGrantMaticMarketValue = BigDecimal.zero()
    total.dystopiaBribeRewardsMarketValue = BigDecimal.zero()
  }
  return total
}
