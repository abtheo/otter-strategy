import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { BuyProduct as BuyProductEvent } from '../generated/OttopiaStore/OttopiaStore'
import { toDecimal } from './utils/Decimals'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTreasuryRevenue, setTreasuryRevenueTotals } from './utils/TreasuryRevenue'
import { BuyProduct } from '../generated/schema'

export function handleBuyProduct(buy: BuyProductEvent): void {
  //Save the buy transaction
  let transaction = loadOrCreateTransaction(buy.transaction, buy.block)

  let entity = new BuyProduct(transaction.id)
  entity.product_id = buy.params.id
  entity.price = toDecimal(buy.params.price, 9)
  entity.amount = buy.params.amount

  let clamPaid = toDecimal(buy.params.amount.times(buy.params.price), 9)
  entity.totalClam = clamPaid

  entity.save()
  //10% of Ottopia CLAM is burned
  //40% of Ottopia CLAM is DAO revenue
  //50% is Prize Pool
  let revenueClam = clamPaid.times(BigDecimal.fromString('0.9'))
  let clamMarketValue = revenueClam.times(getClamUsdRate(buy.block.number))

  log.debug('Ottopia transfered {} CLAM to DAO+PrizePool at time {}, txid {}', [
    revenueClam.toString(),
    buy.block.timestamp.toString(),
    buy.transaction.hash.toHexString(),
  ])

  let revenue = loadOrCreateTreasuryRevenue(buy.block.timestamp)

  revenue.ottopiaClamAmount = revenue.ottopiaClamAmount.plus(revenueClam)
  revenue.ottopiaMarketValue = revenue.ottopiaMarketValue.plus(clamMarketValue)

  revenue = setTreasuryRevenueTotals(revenue)

  revenue.save()
}
