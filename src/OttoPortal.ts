import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { OttoMinted } from '../generated/OttoPortal/OttoPortal'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { getClamUsdRate } from './utils/Price'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTreasuryRevenue } from './utils/TreasuryRevenue'

export function handleOttoMinted(mint: OttoMinted): void {
  let transaction = loadOrCreateTransaction(mint.transaction, mint.block)
  updateProtocolMetrics(transaction)

  let clamPerPortal = BigDecimal.fromString('50')
  let clamPaid = mint.params.quantity.toBigDecimal().times(clamPerPortal)

  //10% of Ottopia CLAM is burned
  let burnedClam = clamPaid.times(BigDecimal.fromString('0.1'))

  //Cumulative total for burned CLAM
  let burns = loadOrCreateTotalBurnedClamSingleton()
  burns.burnedClam = burns.burnedClam.plus(burnedClam)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(getClamUsdRate().times(burnedClam))
  burns.save()

  //40% of Ottopia CLAM is DAO revenue
  let revenueClam = clamPaid.times(BigDecimal.fromString('0.4'))
  let clamMarketValue = revenueClam.times(getClamUsdRate())

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
