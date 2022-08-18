import { ClamPlus, Deposit, Withdraw } from '../generated/ClamPlus/ClamPlus'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { toDecimal } from './utils/Decimals'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { getClamUsdRate } from './utils/Price'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreateAllStakedBalance, loadOrCreateStakedBalance } from './OtterRewardManager'
import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { loadOrCreateTransaction } from './utils/Transactions'

export function handleDeposit(deposit: Deposit): void {
  let tx = loadOrCreateTransaction(deposit.transaction, deposit.block)
  tx.save()
  let pearlBank = PearlBank.bind(PEARL_BANK)
  let clamPlus = ClamPlus.bind(CLAM_PLUS)
  let try_staked = pearlBank.try_totalStaked()
  if (try_staked.reverted) return
  let staked = toDecimal(try_staked.value, 9)
  let autocompoundStake = toDecimal(clamPlus.totalSupply(), 9)
  let clamPrice = getClamUsdRate(deposit.block.number)

  let metric = loadOrCreatePearlBankMetric(deposit.block.timestamp)
  metric.pearlBankDepositedClamAmount = staked.minus(autocompoundStake)
  metric.pearlBankDepositedUsdValue = staked.minus(autocompoundStake).times(clamPrice)

  metric.clamPondDepositedClamAmount = autocompoundStake
  metric.clamPondDepositedUsdValue = autocompoundStake.times(clamPrice)

  metric.totalClamStaked = staked
  metric.totalClamStakedUsdValue = staked.times(clamPrice)
  metric.save()

  //track individual user balances
  let stakedBalance = loadOrCreateStakedBalance(deposit.params.account)
  stakedBalance.clamPondBalance = toDecimal(clamPlus.balanceOf(deposit.params.account), 9)
  stakedBalance.pearlBankBalance = toDecimal(pearlBank.balanceOf(deposit.params.account), 9)
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
  let tx = loadOrCreateTransaction(withdraw.transaction, withdraw.block)
  tx.save()
  log.warning('TX ID: {} WithdrawFee: {}', [tx.id, withdraw.params.fee.toString()])
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
  let stakedBalance = loadOrCreateStakedBalance(withdraw.params.account)
  stakedBalance.clamPondBalance = toDecimal(clamPlus.balanceOf(withdraw.params.account), 9)
  stakedBalance.pearlBankBalance = toDecimal(pearlBank.balanceOf(withdraw.params.account), 9)
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
