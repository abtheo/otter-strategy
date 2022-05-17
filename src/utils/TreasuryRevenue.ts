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
  WETH_CONTRACT,
} from './Constants'
import { getwMaticUsdRate, getClamUsdRate, getwEthUsdRate } from './Price'

export function loadOrCreateTreasuryRevenue(timestamp: BigInt): TreasuryRevenue {
  let ts = dayFromTimestamp(timestamp)

  let treasuryRevenue = TreasuryRevenue.load(ts)
  if (treasuryRevenue == null) {
    treasuryRevenue = new TreasuryRevenue(ts)
    treasuryRevenue.timestamp = timestamp
    treasuryRevenue.qiLockerHarvestAmount = BigDecimal.fromString('0')
    treasuryRevenue.qiLockerHarvestMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.qiDaoInvestmentHarvestAmount = BigDecimal.fromString('0')
    treasuryRevenue.qiDaoInvestmentHarvestMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.totalRevenueMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.totalRevenueClamAmount = BigDecimal.fromString('0')
    treasuryRevenue.buybackClamAmount = BigDecimal.fromString('0')
    treasuryRevenue.buybackMarketValue = BigDecimal.fromString('0')
    treasuryRevenue.cumulativeBuybackClamAmount = BigDecimal.fromString('0')
    treasuryRevenue.cumulativeBuybackMarketValue = BigDecimal.fromString('0')

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
  treasuryRevenue.qiLockerHarvestAmount = treasuryRevenue.qiLockerHarvestAmount.plus(qi)
  treasuryRevenue.qiLockerHarvestMarketValue = treasuryRevenue.qiLockerHarvestMarketValue.plus(qiMarketValue)

  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)
  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)

  treasuryRevenue.save()
}
export function updateTreasuryRevenueTransfer(transfer: Transfer): void {
  let treasuryRevenue = loadOrCreateTreasuryRevenue(transfer.timestamp)

  let qiMarketValue = getQiMarketValue(toDecimal(transfer.value, 18))
  let clamAmount = qiMarketValue.div(getClamUsdRate())

  log.debug('TransferEvent, txid: {}, qiMarketValue {}, clamAmount: {}', [
    transfer.id,
    qiMarketValue.toString(),
    clamAmount.toString(),
  ])

  treasuryRevenue.qiDaoInvestmentHarvestAmount = treasuryRevenue.qiDaoInvestmentHarvestAmount.plus(
    toDecimal(transfer.value, 18),
  )
  treasuryRevenue.qiDaoInvestmentHarvestMarketValue = treasuryRevenue.qiDaoInvestmentHarvestMarketValue.plus(
    qiMarketValue,
  )

  treasuryRevenue.totalRevenueMarketValue = treasuryRevenue.totalRevenueMarketValue.plus(qiMarketValue)
  treasuryRevenue.totalRevenueClamAmount = treasuryRevenue.totalRevenueClamAmount.plus(clamAmount)

  treasuryRevenue.save()
}

export function updateTreasuryRevenueBuyback(buyback: Buyback): void {
  log.debug('BuybackEvent, txid: {}, token: ', [buyback.id, buyback.token.toHexString()])
  let treasuryRevenue = loadOrCreateTreasuryRevenue(buyback.timestamp)
  let marketValue = BigDecimal.fromString('0')
  let clamAmountDec = buyback.clamAmount.divDecimal(BigDecimal.fromString('1e9'))

  treasuryRevenue.buybackClamAmount = treasuryRevenue.buybackClamAmount.plus(clamAmountDec)
  if (buyback.token.toHexString().toLowerCase() == QI_ERC20_CONTRACT.toLowerCase()) {
    marketValue = getQiMarketValue(toDecimal(buyback.tokenAmount, 18))
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }
  if (buyback.token.toHexString().toLowerCase() == MATIC_ERC20_CONTRACT.toLowerCase()) {
    marketValue = getwMATICMarketValue(toDecimal(buyback.tokenAmount, 18))
    treasuryRevenue.buybackMarketValue = treasuryRevenue.buybackMarketValue.plus(marketValue)
    log.debug('BuybackEvent using Qi, txid: {}', [buyback.id])
  }

  if (buyback.token.toHexString().toLowerCase() == WETH_CONTRACT.toLowerCase()) {
    marketValue = getwETHMarketValue(toDecimal(buyback.tokenAmount, 18))
    log.debug('BuybackEvent using wETH, txid: {}', [buyback.id])
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
  //If token is not tracked or buyback has no value, skip
  if (marketValue == BigDecimal.fromString('0')) return

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

export function getwMATICMarketValue(balance: BigDecimal): BigDecimal {
  let usdPerwMATIC = getwEthUsdRate()
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

export function loadOrCreateTotalBuybacksSingleton(): TotalBuybacks {
  let total = TotalBuybacks.load('1')
  if (total == null) {
    total = new TotalBuybacks('1')
    total.boughtClam = BigDecimal.fromString('0')
    total.boughtMarketValue = BigDecimal.fromString('0')
  }
  return total
}
