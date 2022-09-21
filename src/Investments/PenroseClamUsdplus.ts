import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import {
  DAO_WALLET_PENROSE_USER_PROXY,
  DYSTOPIA_PAIR_USDPLUS_CLAM,
  PENROSE_REWARD_USDPLUS_CLAM,
} from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { PenroseMultiRewards } from '../../generated/PenrosePartnerRewards/PenroseMultiRewards'
import { getDystPairUSD } from '../utils/Price'

export class PenroseClamUsdPlusInvestment implements InvestmentInterface {
  public investment!: Investment
  private readonly strategy: string = 'CLAM/USD+'
  private readonly protocol: string = 'Penrose'
  private readonly startBlock: BigInt = BigInt.fromI32(30393227) //29069971
  private currentBlock: BigInt = BigInt.zero()

  constructor(transaction: Transaction) {
    this.currentBlock = transaction.blockNumber
    if (transaction.blockNumber.ge(this.startBlock)) {
      let _investment = loadOrCreateInvestment(this.strategy, transaction.timestamp)
      _investment.protocol = this.protocol
      _investment.netAssetValue = this.netAssetValue()
      this.investment = _investment
      this.investment.save()
    }
  }

  netAssetValue(): BigDecimal {
    if (this.currentBlock.ge(this.startBlock)) {
      let penroseRewards = PenroseMultiRewards.bind(PENROSE_REWARD_USDPLUS_CLAM).try_balanceOf(
        DAO_WALLET_PENROSE_USER_PROXY,
      )
      let penroseRewardBalance = penroseRewards.reverted ? BigInt.zero() : penroseRewards.value
      return getDystPairUSD(this.currentBlock, penroseRewardBalance, DYSTOPIA_PAIR_USDPLUS_CLAM)
    }
    return BigDecimal.zero()
  }

  addRevenue(claim: ClaimReward): void {
    //aggregate per day
    let dayTotal = this.investment.harvestValue.plus(claim.amountUsd)
    this.investment.harvestValue = dayTotal

    let rewardRate = dayTotal.div(this.netAssetValue()).times(BigDecimal.fromString('100'))
    this.investment.rewardRate = rewardRate

    // (payout*365 / stakedValue) * 100% = APR%
    this.investment.apr = rewardRate.times(BigDecimal.fromString('365'))

    this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
    this.investment.save()
  }
}
