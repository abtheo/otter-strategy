import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { BuyProduct as BuyProductEvent } from '../generated/OttopiaStore/OttopiaStore'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { toDecimal } from './utils/Decimals'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTreasuryRevenue } from './utils/TreasuryRevenue'
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
  let burnedClam = clamPaid.times(BigDecimal.fromString('0.1'))

  //Cumulative total for burned CLAM
  let burns = loadOrCreateTotalBurnedClamSingleton()
  burns.burnedClam = burns.burnedClam.plus(burnedClam)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(getClamUsdRate(buy.block.number).times(burnedClam))
  burns.save()

  //40% of Ottopia CLAM is DAO revenue
  let revenueClam = clamPaid.times(BigDecimal.fromString('0.4'))
  let clamMarketValue = revenueClam.times(getClamUsdRate(mint.block.number))

  log.debug('Ottopia transfered {} CLAM to DAO and burned {} CLAM at time {}, txid {}', [
    revenueClam.toString(),
    burnedClam.toString(),
    mint.block.timestamp.toString(),
    mint.transaction.hash.toHexString(),
  ])

  let revenue = loadOrCreateTreasuryRevenue(mint.block.timestamp)

  revenue.ottopiaClamAmount = revenue.ottopiaClamAmount.plus(revenueClam)
  revenue.ottopiaMarketValue = revenue.ottopiaMarketValue.plus(clamMarketValue)

  //add to total revenue
  revenue.totalRevenueClamAmount = revenue.totalRevenueClamAmount.plus(revenueClam)
  revenue.totalRevenueMarketValue = revenue.totalRevenueMarketValue.plus(clamMarketValue)

  revenue.save()
}
