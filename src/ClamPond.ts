import { Deposit, Withdraw } from '../generated/ClamPond/ClamPond'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { ClamPlus } from '../generated/ClamPond/ClamPlus'
import { CLAM_PLUS } from './utils/Constants'
import { getClamUsdRate } from './utils/Price'
import { log } from '@graphprotocol/graph-ts'

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

  cumulativeValues.clamPondDepositedAmount = cumulativeValues.clamPondDepositedAmount.minus(
    toDecimal(withdraw.params.amount, 6),
  )
  metric.clamPondDepositedAmount = cumulativeValues.clamPondDepositedAmount

  cumulativeValues.save()
  metric.save()

  //add to burns if early withdrawal
  let burns = loadOrCreateTotalBurnedClamSingleton()
  let currentClamPondBurn = toDecimal(ClamPlus.bind(CLAM_PLUS).totalBurn(), 9)
  let burnDiff = currentClamPondBurn.minus(burns.clamPondTotal)
  log.debug('Burned CLAM change from {} to {}, diff {}', [
    burns.clamPondTotal.toString(),
    currentClamPondBurn.toString(),
    burnDiff.toString(),
  ])

  burns.burnedClam = burns.burnedClam.plus(burnDiff)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(burnDiff.times(getClamUsdRate(withdraw.block.number)))
  burns.clamPondTotal = currentClamPondBurn
  burns.save()
}
