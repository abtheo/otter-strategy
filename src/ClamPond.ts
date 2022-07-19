import { Deposit, Withdraw } from '../generated/ClamPond/ClamPond'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'

export function handleDeposit(deposit: Deposit): void {
  let cumulativeValues = loadCumulativeValues()
  let metric = loadOrCreatePearlBankMetric(deposit.block.timestamp)

  cumulativeValues.clamPondDepositedAmount = cumulativeValues.clamPondDepositedAmount.plus(
    toDecimal(deposit.params.amount, 6),
  )
  metric.clamPondDepositedAmount = cumulativeValues.clamPondDepositedAmount

  cumulativeValues.save()
  metric.save()
}

export function handleWithdraw(withdraw: Withdraw): void {
  let cumulativeValues = loadCumulativeValues()
  let metric = loadOrCreatePearlBankMetric(withdraw.block.timestamp)

  withdraw.params.amount

  cumulativeValues.clamPondDepositedAmount = cumulativeValues.clamPondDepositedAmount.minus(
    toDecimal(withdraw.params.amount, 6),
  )
  metric.clamPondDepositedAmount = cumulativeValues.clamPondDepositedAmount

  cumulativeValues.save()
  metric.save()
}
