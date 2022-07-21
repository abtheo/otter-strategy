import { Payout } from '../generated/OtterRewardManager/OtterRewardManager'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'
import { BigDecimal } from '@graphprotocol/graph-ts'
import { ClamPlus } from '../generated/OtterRewardManager/ClamPlus'

export function handlePayout(payout: Payout): void {
  let transaction = loadOrCreateTransaction(payout.transaction, payout.block)
  updateProtocolMetrics(transaction)

  let metric = loadOrCreatePearlBankMetric(payout.block.timestamp)
  let clamPrice = getClamUsdRate(payout.block.number)
  let clamPondStakedClam = toDecimal(ClamPlus.bind(CLAM_PLUS).totalSupply(), 9)
  let pearlBankStakedClam = toDecimal(PearlBank.bind(PEARL_BANK).totalSupply(), 9)

  let stakedUsd = clamPondStakedClam.plus(pearlBankStakedClam).times(clamPrice)
  let payoutValue = toDecimal(payout.params.totalUsdPlus, 6)

  // update cumulative values
  let cumulativeValues = loadCumulativeValues()
  let newTotalPaid = cumulativeValues.rewardPayoutMarketValue.plus(metric.payoutMarketValue)
  cumulativeValues.rewardPayoutMarketValue = newTotalPaid
  cumulativeValues.save()

  // update metrics
  metric.payoutMarketValue = payoutValue
  metric.clamMarketValueWhenPayoutHappens = clamPrice
  metric.totalClamStakedUsdValue = stakedUsd

  // (stakedValue * APR) / 365 = payout
  // (payout*365 / stakedValue) * 100% = APR%
  metric.apr = payoutValue
    .times(BigDecimal.fromString('365'))
    .div(stakedUsd)
    .times(BigDecimal.fromString('100'))

  // persist
  metric.save()
}
