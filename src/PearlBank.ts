import { OtterClamERC20V2 } from '../generated/PearlBank/OtterClamERC20V2'
import { ClamPlus } from '../generated/PearlBank/ClamPlus'
import { PearlBank, Stake, Withdraw } from '../generated/PearlBank/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_ERC20, CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { getClamUsdRate } from './utils/Price'
import { log } from '@graphprotocol/graph-ts'

export function handleStake(stake: Stake): void {
  let clam = OtterClamERC20V2.bind(CLAM_ERC20)
  let pearlBank = PearlBank.bind(PEARL_BANK)

  let metric = loadOrCreatePearlBankMetric(stake.block.timestamp)
  metric.clamTotalSupply = toDecimal(clam.totalSupply(), 6)
  metric.stakedCLAMAmount = toDecimal(pearlBank.totalStaked())

  metric.save()
}

export function handleWithdraw(withdraw: Withdraw): void {
  let clam = OtterClamERC20V2.bind(CLAM_ERC20)
  let pearlBank = PearlBank.bind(PEARL_BANK)

  let metric = loadOrCreatePearlBankMetric(withdraw.block.timestamp)
  metric.clamTotalSupply = toDecimal(clam.totalSupply(), 9)
  metric.stakedCLAMAmount = toDecimal(pearlBank.totalStaked(), 9)

  //add to burns if early withdrawal
  let burns = loadOrCreateTotalBurnedClamSingleton()
  let currentPearlBankBurn = toDecimal(ClamPlus.bind(CLAM_PLUS).totalBurn(), 9)
  let burnDiff = currentPearlBankBurn.minus(burns.pearlBankTotal)
  log.debug('Burned CLAM change from {} to {}, diff {}', [
    burns.pearlBankTotal.toString(),
    currentPearlBankBurn.toString(),
    burnDiff.toString(),
  ])

  burns.burnedClam = burns.burnedClam.plus(burnDiff)
  burns.burnedValueUsd = burns.burnedValueUsd.plus(burnDiff.times(getClamUsdRate(withdraw.block.number)))
  burns.pearlBankTotal = currentPearlBankBurn
}
