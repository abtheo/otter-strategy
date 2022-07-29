import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { BuyProduct as BuyProductEvent } from '../generated/OttopiaStore/OttopiaStore'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { toDecimal } from './utils/Decimals'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTreasuryRevenue, setTreasuryRevenueTotals } from './utils/TreasuryRevenue'
import { BuyProduct } from '../generated/schema'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function handleBuyProduct(buy: BuyProductEvent): void {
  //Save the buy transaction
  let transaction = loadOrCreateTransaction(buy.transaction, buy.block)
  //trigger a ProtocolMetrics update
  updateProtocolMetrics(transaction)

  let entity = new BuyProduct(transaction.id)
  entity.product_id = buy.params.id
  entity.price = toDecimal(buy.params.price, 9)
  entity.amount = buy.params.amount

  let clamPaid = toDecimal(buy.params.amount.times(buy.params.price), 9)
  entity.totalClam = clamPaid

  entity.save()
  //10% of Ottopia CLAM is burned
  let burnedClam = clamPaid.times(BigDecimal.fromString('0.1'))

  //Cumulative total for burned CLAM
  let burns = loadOrCreateTotalBurnedClamSingleton()
  burns.burnedClam = burns.burnedClam.plus(burnedClam)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(getClamUsdRate(buy.block.number).times(burnedClam))
  burns.save()

  //40% of Ottopia CLAM is DAO revenue
  //50% is Prize Pool
  let revenueClam = clamPaid.times(BigDecimal.fromString('0.9'))
  let clamMarketValue = revenueClam.times(getClamUsdRate(buy.block.number))

  log.debug('Ottopia transfered {} CLAM to DAO+PrizePool and burned {} CLAM at time {}, txid {}', [
    revenueClam.toString(),
    burnedClam.toString(),
    buy.block.timestamp.toString(),
    buy.transaction.hash.toHexString(),
  ])

  let revenue = loadOrCreateTreasuryRevenue(buy.block.timestamp)

  revenue.ottopiaClamAmount = revenue.ottopiaClamAmount.plus(revenueClam)
  revenue.ottopiaMarketValue = revenue.ottopiaMarketValue.plus(clamMarketValue)

  revenue = setTreasuryRevenueTotals(revenue)

  revenue.save()
}
