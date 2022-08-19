import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { OttoMinted } from '../generated/OttoPortal/OttoPortal'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTreasuryRevenue } from './utils/TreasuryRevenue'
import { BuyProduct } from '../generated/schema'

export function handleOttoMinted(mint: OttoMinted): void {
  let transaction = loadOrCreateTransaction(mint.transaction, mint.block)
  // updateProtocolMetrics(transaction)

  let clamPerPortal = BigDecimal.fromString('50')
  let clamPaid = mint.params.quantity.toBigDecimal().times(clamPerPortal)

  //track the Buy event for NFT sales feed
  let buy = new BuyProduct(transaction.id)
  buy.price = clamPerPortal
  buy.product_id = BigInt.fromI32(-1)
  buy.totalClam = clamPaid
  buy.amount = mint.params.quantity
  buy.save()

  //10% of Ottopia CLAM is burned
  //40% of Ottopia CLAM is DAO revenue
  //50% is Prize Pool
  let revenueClam = clamPaid.times(BigDecimal.fromString('0.9'))
  let clamMarketValue = revenueClam.times(getClamUsdRate(mint.block.number))

  log.debug('Ottopia Portal mint transfered {} CLAM to DAO+PrizePool at time {}, txid {}', [
    revenueClam.toString(),
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
