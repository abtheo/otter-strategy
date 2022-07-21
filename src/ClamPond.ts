import { ClamPond, Deposit, Withdraw } from '../generated/ClamPond/ClamPond'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { CLAM_PLUS } from './utils/Constants'
import { getClamUsdRate } from './utils/Price'

export function handleDeposit(deposit: Deposit): void {
  let clamPondStakedClam = toDecimal(ClamPond.bind(CLAM_PLUS).totalSupply(), 9)
  let clamPondMv = clamPondStakedClam.times(getClamUsdRate(deposit.block.number))

  let metric = loadOrCreatePearlBankMetric(deposit.block.timestamp)
  metric.clamPondDepositedClamAmount = clamPondStakedClam
  metric.clamPondDepositedUsdValue = clamPondMv

  metric.totalClamStaked = metric.clamPondDepositedClamAmount.plus(metric.pearlBankDepositedClamAmount)
  metric.save()
}

export function handleWithdraw(withdraw: Withdraw): void {
  let clamPondStakedClam = toDecimal(ClamPond.bind(CLAM_PLUS).totalSupply(), 9)
  let clamPondMv = clamPondStakedClam.times(getClamUsdRate(withdraw.block.number))

  let metric = loadOrCreatePearlBankMetric(withdraw.block.timestamp)
  metric.clamPondDepositedClamAmount = clamPondStakedClam
  metric.clamPondDepositedUsdValue = clamPondMv
  metric.totalClamStaked = clamPondStakedClam.plus(metric.pearlBankDepositedClamAmount)
  metric.save()

  //add to burns if early withdrawal
  let burns = loadOrCreateTotalBurnedClamSingleton()
  let burnedClam = toDecimal(withdraw.params.fee, 9)
  burns.burnedClam = burns.burnedClam.plus(burnedClam)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(getClamUsdRate(withdraw.block.number).times(burnedClam))
  burns.save()
}
