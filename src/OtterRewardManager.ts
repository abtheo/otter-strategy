import { Payout } from '../generated/OtterRewardManager/OtterRewardManager'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_PLUS, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'
import { getClamUsdRate } from './utils/Price'
import { Address, BigDecimal, log } from '@graphprotocol/graph-ts'
import { AllStakedBalance, StakedBalance } from '../generated/schema'
import { ClamPlus } from '../generated/OtterRewardManager/ClamPlus'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'
import { loadOrCreateTransaction } from './utils/Transactions'

export function handlePayout(payout: Payout): void {
  let pearlBank = PearlBank.bind(PEARL_BANK)
  let clamPlus = ClamPlus.bind(CLAM_PLUS)
  let metric = loadOrCreatePearlBankMetric(payout.block.timestamp)
  let clamPrice = getClamUsdRate(payout.block.number)
  let pearlBankStakedClam = toDecimal(pearlBank.totalSupply(), 9)

  let stakedUsd = pearlBankStakedClam.times(clamPrice)
  let payoutValue = toDecimal(payout.params.totalUsdPlus, 6)
  let rewardRate = payoutValue.div(stakedUsd)

  // update cumulative values
  let cumulativeValues = loadCumulativeValues()
  let newTotalPaid = cumulativeValues.rewardPayoutMarketValue.plus(payoutValue)
  cumulativeValues.rewardPayoutMarketValue = newTotalPaid
  cumulativeValues.save()
  log.debug('Cumulative value rewards: {}', [cumulativeValues.rewardPayoutMarketValue.toString()])

  // update metrics
  metric.payoutMarketValue = payoutValue
  metric.clamMarketValueWhenPayoutHappens = clamPrice
  metric.totalClamStakedUsdValue = stakedUsd
  metric.cumulativeRewardPayoutMarketValue = newTotalPaid
  metric.rewardRate = rewardRate.times(BigDecimal.fromString('100'))

  // (stakedValue * APR) / 365 = payout
  // (payout*365 / stakedValue) * 100% = APR%
  metric.apr = rewardRate.times(BigDecimal.fromString('365')).times(BigDecimal.fromString('100'))

  //( (1+(payout/staked))^365 -1 ) * 100% = APY%
  metric.apy = BigDecimal.fromString(
    (
      (Math.pow(
        Number.parseFloat(
          BigDecimal.fromString('1')
            .plus(rewardRate)
            .toString(),
        ),
        365,
      ) -
        1) *
      100
    ).toString(),
  )
  metric.save()

  //find last payout value for all staked addresses
  let allBalances = loadOrCreateAllStakedBalance()
  let newBalanceIds: string[] = []
  for (let i = 0; i < allBalances.balances.length; i++) {
    let userBalance = loadOrCreateStakedBalance(Address.fromString(allBalances.balances[i]))

    userBalance.pearlBankLastPayout = userBalance.pearlBankBalance.times(rewardRate).times(clamPrice)
    userBalance.clamPondLastPayout = userBalance.clamPondBalance.times(rewardRate)
    userBalance.clamPondLastPayoutUsd = userBalance.clamPondBalance.times(rewardRate).times(clamPrice)

    userBalance.pearlBankBalance = toDecimal(pearlBank.balanceOf(Address.fromString(userBalance.id)), 9)
    userBalance.clamPondBalance = toDecimal(clamPlus.balanceOf(Address.fromString(userBalance.id)), 9)
    userBalance.save()

    newBalanceIds.push(userBalance.id)
  }
  allBalances.balances = newBalanceIds
  allBalances.save()

  let transaction = loadOrCreateTransaction(payout.transaction, payout.block)
  updateProtocolMetrics(transaction)
}

export function loadOrCreateStakedBalance(address: Address): StakedBalance {
  let balance = StakedBalance.load(address.toHexString())
  if (balance == null) {
    balance = new StakedBalance(address.toHexString())
    balance.clamPondBalance = BigDecimal.zero()
    balance.clamPondLastPayout = BigDecimal.zero()
    balance.clamPondLastPayoutUsd = BigDecimal.zero()
    balance.pearlBankBalance = BigDecimal.zero()
    balance.pearlBankLastPayout = BigDecimal.zero()
    balance.save()
  }
  return balance
}

export function loadOrCreateAllStakedBalance(): AllStakedBalance {
  let balance = AllStakedBalance.load('1')
  if (balance == null) {
    balance = new AllStakedBalance('1')
    balance.balances = []
    balance.save()
  }
  return balance
}
