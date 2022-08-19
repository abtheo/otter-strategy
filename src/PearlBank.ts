import { PearlBank, Stake, Withdraw } from '../generated/PearlBank/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getClamUsdRate } from './utils/Price'
import { ClamPlus } from '../generated/OtterRewardManager/ClamPlus'
import { loadOrCreateAllStakedBalance, loadOrCreateStakedBalance } from './OtterRewardManager'
import { log } from '@graphprotocol/graph-ts'

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

  //track individual user balances
  let stakedBalance = loadOrCreateStakedBalance(stake.params.addr)
  stakedBalance.clamPondBalance = toDecimal(clamPlus.balanceOf(stake.params.addr), 9)
  stakedBalance.pearlBankBalance = toDecimal(pearlBank.balanceOf(stake.params.addr), 9)
  stakedBalance.save()
  //ensure user is part of tracking array
  let allBalances = loadOrCreateAllStakedBalance()
  allBalances.balances = allBalances.balances.concat([stakedBalance.id])
  allBalances.save()
  log.debug('User {} pearl balance {} clam+ balance {}, all balances len {}', [
    stakedBalance.id,
    stakedBalance.pearlBankBalance.toString(),
    stakedBalance.clamPondBalance.toString(),
    allBalances.balances.length.toString(),
  ])
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

  //track individual user balances
  let stakedBalance = loadOrCreateStakedBalance(withdraw.params.addr)
  stakedBalance.clamPondBalance = toDecimal(clamPlus.balanceOf(withdraw.params.addr), 9)
  stakedBalance.pearlBankBalance = toDecimal(pearlBank.balanceOf(withdraw.params.addr), 9)
  stakedBalance.save()

  //ensure user is part of tracking array
  let allBalances = loadOrCreateAllStakedBalance()
  allBalances.balances = allBalances.balances.concat([stakedBalance.id])
  allBalances.save()
  log.debug('User {} pearl balance {} clam+ balance {}, all balances len {}', [
    stakedBalance.id,
    stakedBalance.pearlBankBalance.toString(),
    stakedBalance.clamPondBalance.toString(),
    allBalances.balances.length.toString(),
  ])
}
