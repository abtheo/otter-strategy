import { ClamPlus, Deposit, Withdraw, DepositPearl, WithdrawPearl } from '../generated/ClamPlus/ClamPlus'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { toDecimal } from './utils/Decimals'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { getClamUsdRate } from './utils/Price'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreateAllStakedBalance, loadOrCreateStakedBalance } from './OtterRewardManager'
import { Address, ethereum, log } from '@graphprotocol/graph-ts'

export function handleDeposit(deposit: Deposit): void {
  updateStakedBalances(deposit.block, deposit.params.account)
}

export function handleWithdraw(withdraw: Withdraw): void {
  updateStakedBalances(withdraw.block, withdraw.params.account)
}

export function handleDepositPearl(deposit: DepositPearl): void {
  updateStakedBalances(deposit.block, deposit.params.account)
}

export function handleWithdrawPearl(withdraw: WithdrawPearl): void {
  updateStakedBalances(withdraw.block, withdraw.params.account)
}

//TODO: handleTransfer between wallets (not staking contracts)

export function updateStakedBalances(block: ethereum.Block, account: Address): void {
  let pearlBank = PearlBank.bind(PEARL_BANK)
  let clamPlus = ClamPlus.bind(CLAM_PLUS)
  let try_staked = pearlBank.try_totalStaked()
  if (try_staked.reverted) return
  let staked = toDecimal(try_staked.value, 9)
  let autocompoundStake = toDecimal(clamPlus.totalSupply(), 9)
  let clamPrice = getClamUsdRate(block.number)

  let metric = loadOrCreatePearlBankMetric(block.timestamp)
  metric.pearlBankDepositedClamAmount = staked.minus(autocompoundStake)
  metric.pearlBankDepositedUsdValue = staked.minus(autocompoundStake).times(clamPrice)

  metric.clamPondDepositedClamAmount = autocompoundStake
  metric.clamPondDepositedUsdValue = autocompoundStake.times(clamPrice)

  metric.totalClamStaked = staked
  metric.totalClamStakedUsdValue = staked.times(clamPrice)
  metric.save()

  //track individual user balances
  let stakedBalance = loadOrCreateStakedBalance(account)
  stakedBalance.clamPondBalance = toDecimal(clamPlus.balanceOf(account), 9)
  stakedBalance.pearlBankBalance = toDecimal(pearlBank.balanceOf(account), 9)
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
