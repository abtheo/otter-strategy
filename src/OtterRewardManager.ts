import { Payout } from '../generated/OtterRewardManager/OtterRewardManager'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'
import { getClamUsdRate } from './utils/Price'
import { ClamPond } from '../generated/OtterRewardManager/ClamPond'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function handlePayout(payout: Payout): void {
  let transaction = loadOrCreateTransaction(payout.transaction, payout.block)
  updateProtocolMetrics(transaction)

  let metric = loadOrCreatePearlBankMetric(payout.block.timestamp)
  let clamPrice = getClamUsdRate(payout.block.number)
  let clamPondStakedClam = toDecimal(ClamPond.bind(CLAM_PLUS).totalSupply(), 9)
  let pearlBankStakedClam = toDecimal(PearlBank.bind(PEARL_BANK).totalSupply(), 9)

  let stakedUsd = clamPondStakedClam.plus(pearlBankStakedClam).times(clamPrice)

  // update cumulative values
  let cumulativeValues = loadCumulativeValues()
  let newTotalPaid = cumulativeValues.rewardPayoutMarketValue.plus(metric.payoutMatketValue)
  cumulativeValues.rewardPayoutMarketValue = newTotalPaid
  metric.save()

  // update metrics
  metric.payoutMatketValue = toDecimal(payout.params.totalUsdPlus, 6)
  metric.cumulativeRewardPayoutMarketValue = newTotalPaid
  metric.apr = toDecimal(payout.params.totalUsdPlus, 6).div(stakedUsd)
  metric.clamMarketValueWhenPayoutHappens = clamPrice
  metric.totalClamStakedUsdValue = stakedUsd

  // persist
  cumulativeValues.save()
}
