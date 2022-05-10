import { toDecimal } from './Decimals'
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from './Dates'
import { TreasuryRevenue, Transaction, Harvest, Transfer, Buyback, TotalBuybacks } from '../../generated/schema'
import { getQiMarketValue } from './ProtocolMetrics'
import {
  QI_ERC20_CONTRACT,
  DAI_ERC20_CONTRACT,
  MAI_ERC20_CONTRACT,
  FRAX_ERC20_CONTRACT,
  MATIC_ERC20_CONTRACT,
} from './Constants'
import { getwMaticUsdRate, getClamUsdRate } from './Price'

export function loadOrCreateTreasuryRevenue(timestamp: BigInt): TreasuryRevenue {
  let ts = dayFromTimestamp(timestamp)

  let treasuryRevenue = TreasuryRevenue.load(ts)
  if (treasuryRevenue == null) {
    treasuryRevenue = new TreasuryRevenue(ts)
    treasuryRevenue.timestamp = timestamp
    treasuryRevenue.qiLockerHarvestAmount = BigInt.fromString('0')
    treasuryRevenue.qiLockerHarvestMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.qiDaoInvestmentHarvestAmount = BigInt.fromString('0')
    treasuryRevenue.qiDaoInvestmentHarvestMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.totalRevenueMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.totalRevenueClamAmount = BigInt.fromString('0')
    treasuryRevenue.buybackClamAmount = BigInt.fromString('0')
    treasuryRevenue.buybackMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.cumulativeBuybackClamAmount = BigInt.fromString('0')
    treasuryRevenue.cumulativeBuybackMarketValue = BigDecimal.fromString('0')

    treasuryRevenue.save()
  }
  return treasuryRevenue as TreasuryRevenue
}

export function updateTreasuryRevenueHarvest(harvest: Harvest): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(harvest.timestamp)
  let qiMarketValue = getQiMarketValue(toDecimal(harvest.amount, 18))
  let clamAmount = BigInt.fromString(
    qiMarketValue
      .div(getClamUsdRate())
      .times(BigDecimal.fromString('1e9'))
      .truncate(0)
      .toString(),
  )
  log.debug('HarvestEvent, txid: {}, qiMarketValue {}, clamAmount {}', [
    harvest.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  //Aggregate over day with +=
  treasuryRevenue.qiLockerHarvestAmount = treasuryRevenue.qiLockerHarvestAmount.plus(harvest.amount)
  treasuryRevenue.qiLockerHarvestMarketValue = treasuryRevenue.qiLockerHarvestMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)
  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)

  treasuryRevenue.save()
}
export function updateTreasuryRevenueTransfer(transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let qiMarketValue = getQiMarketValue(toDecimal(transfer.value, 18))
  let clamAmount = BigInt.fromString(
    qiMarketValue
      .div(getClamUsdRate())
      .times(BigDecimal.fromString('1e9'))
      .truncate(0)
      .toString(),
  )
  log.debug('TransferEvent, txid: {}, qiMarketValue {}, clamAmount: {}', [
    transfer.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.qiDaoInvestmentHarvestAmount = treasuryRevenue.qiDaoInvestmentHarvestAmount.plus(transfer.value)
  treasuryRevenue.qiDaoInvestmentHarvestMarketValue = treasuryRevenue.qiDaoInvestmentHarvestMarketValue.plus(
    qiMarketValue,
  )

  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)
  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueBuyback(buyback: Buyback): void {
  log.debug('DeprecatedBuybackEvent, txid: {}, token: ', [buyback.id, buyback.token.toHexString()])
  let treasuryRevenue = loadOrCreateTreasuryRevenue(buyback.timestamp)
  let marketValue = BigDecimal.fromString('0')

  treasuryRevenue.buybackClamAmount = treasuryRevenue.buybackClamAmount.plus(buyback.clamAmount)
  if (buyback.token.toHexString().toLowerCase() == QI_ERC20_CONTRACT.toLowerCase()) {
    marketValue = getQiMarketValue(toDecimal(buyback.tokenAmount, 18))
    treasuryRevenue.buybackMarketValue = treasuryRevenue.buybackMarketValue.plus(marketValue)
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }
  if (buyback.token.toHexString().toLowerCase() == MATIC_ERC20_CONTRACT.toLowerCase()) {
    marketValue = getwMATICMarketValue(toDecimal(buyback.tokenAmount, 18))
    treasuryRevenue.buybackMarketValue = treasuryRevenue.buybackMarketValue.plus(marketValue)
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }
  //stablecoins (18 decimals)
  if (
    buyback.token.toHexString().toLowerCase() == DAI_ERC20_CONTRACT.toLowerCase() ||
    buyback.token.toHexString().toLowerCase() == FRAX_ERC20_CONTRACT.toLowerCase() ||
    buyback.token.toHexString().toLowerCase() == MAI_ERC20_CONTRACT.toLowerCase()
  ) {
    marketValue = toDecimal(buyback.tokenAmount, 18)
    treasuryRevenue.buybackMarketValue = treasuryRevenue.buybackMarketValue.plus(marketValue)
    log.debug('BuybackEvent using Stablecoins, txid: {}', [buyback.id])
  }

  //Aggregate all history with singleton pattern
  let cumulativeBuybacks = loadOrCreateTotalBuybacksSingleton()
  cumulativeBuybacks.boughtClam = cumulativeBuybacks.boughtClam.plus(buyback.clamAmount)
  cumulativeBuybacks.boughtMarketValue = cumulativeBuybacks.boughtMarketValue.plus(marketValue)
  cumulativeBuybacks.save()

  treasuryRevenue.cumulativeBuybackClamAmount = cumulativeBuybacks.boughtClam
  treasuryRevenue.cumulativeBuybackMarketValue = cumulativeBuybacks.boughtMarketValue

  treasuryRevenue.save()
}

export function getwMATICMarketValue(balance: BigDecimal): BigDecimal {
  let usdPerwMATIC = getwMaticUsdRate()
  log.debug('1 wMATIC = {} USD', [usdPerwMATIC.toString()])

  let marketValue = balance.times(usdPerwMATIC)
  log.debug('wMATIC marketValue = {}', [marketValue.toString()])
  return marketValue
}

export function loadOrCreateTotalBuybacksSingleton(): TotalBuybacks {
  let total = TotalBuybacks.load('1')
  if (total == null) {
    total = new TotalBuybacks('1')
    total.boughtClam = BigInt.fromString('0')
    total.boughtMarketValue = BigDecimal.fromString('0')
  }
  return total
}
