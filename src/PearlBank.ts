import { PearlBank, Stake, Withdraw } from '../generated/PearlBank/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { getClamUsdRate } from './utils/Price'
import { ClamPlus } from '../generated/OtterRewardManager/ClamPlus'

export function handleStake(stake: Stake): void {
  let pearlBank = PearlBank.bind(PEARL_BANK)
  let clamPlus = ClamPlus.bind(CLAM_PLUS)
  let try_staked = pearlBank.try_totalStaked()
  if (try_staked.reverted) return
  let staked = toDecimal(try_staked.value, 9)
  let autocompoundStake = toDecimal(clamPlus.totalSupply(), 9)
  let clamPrice = getClamUsdRate(stake.block.number)

  let metric = loadOrCreatePearlBankMetric(stake.block.timestamp)
  metric.pearlBankDepositedClamAmount = staked.minus(autocompoundStake)
  metric.pearlBankDepositedUsdValue = staked.minus(autocompoundStake).times(clamPrice)

  metric.clamPondDepositedClamAmount = autocompoundStake
  metric.clamPondDepositedUsdValue = autocompoundStake.times(clamPrice)

  metric.totalClamStaked = staked
  metric.totalClamStakedUsdValue = staked.times(clamPrice)
  metric.save()
}

export function handleWithdraw(withdraw: Withdraw): void {
  let pearlBank = PearlBank.bind(PEARL_BANK)
  let clamPlus = ClamPlus.bind(CLAM_PLUS)
  let try_staked = pearlBank.try_totalStaked()
  if (try_staked.reverted) return
  let staked = toDecimal(try_staked.value, 9)
  let autocompoundStake = toDecimal(clamPlus.totalSupply(), 9)
  let clamPrice = getClamUsdRate(withdraw.block.number)

  let metric = loadOrCreatePearlBankMetric(withdraw.block.timestamp)
  metric.pearlBankDepositedClamAmount = staked.minus(autocompoundStake)
  metric.pearlBankDepositedUsdValue = staked.minus(autocompoundStake).times(clamPrice)

  metric.clamPondDepositedClamAmount = autocompoundStake
  metric.clamPondDepositedUsdValue = autocompoundStake.times(clamPrice)
  metric.totalClamStaked = staked
  metric.totalClamStakedUsdValue = staked.times(clamPrice)

  metric.save()

  //Cumulative total for burned CLAM
  let burns = loadOrCreateTotalBurnedClamSingleton()
  let burnedClam = toDecimal(withdraw.params.fee, 9)
  burns.burnedClam = burns.burnedClam.plus(burnedClam)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(getClamUsdRate(withdraw.block.number).times(burnedClam))
  burns.save()
}
