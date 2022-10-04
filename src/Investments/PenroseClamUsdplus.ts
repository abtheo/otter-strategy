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
  public readonly strategy: string = 'CLAM/USD+'
  public readonly protocol: string = 'Penrose'
  public readonly startBlock: BigInt = BigInt.fromI32(30393227) //29069971
  private currentBlock: BigInt = BigInt.zero()
  private active: boolean = false

  constructor(transaction: Transaction) {
    this.currentBlock = transaction.blockNumber
    if (transaction.blockNumber.ge(this.startBlock)) {
      this.active = true
      let nav = this.netAssetValue()
      if (nav.gt(BigDecimal.fromString('10'))) {
        let _investment = loadOrCreateInvestment(this.strategy, transaction.timestamp)
        _investment.protocol = this.protocol
        _investment.netAssetValue = nav
        this.investment = _investment
        this.investment.save()
      } else {
        this.active = false
      }
    }
  }

  netAssetValue(): BigDecimal {
    if (this.active) {
      let penroseRewards = PenroseMultiRewards.bind(PENROSE_REWARD_USDPLUS_CLAM).try_balanceOf(
        DAO_WALLET_PENROSE_USER_PROXY,
      )
      let penroseRewardBalance = penroseRewards.reverted ? BigInt.zero() : penroseRewards.value
      return getDystPairUSD(this.currentBlock, penroseRewardBalance, DYSTOPIA_PAIR_USDPLUS_CLAM)
    }
    return BigDecimal.zero()
  }

  addRevenue(claim: ClaimReward): void {
    if (this.active) {
      //aggregate per day
      let dayTotal = this.investment.grossRevenue.plus(claim.amountUsd)
      this.investment.grossRevenue = dayTotal

      let rewardRate = dayTotal.div(this.netAssetValue()).times(BigDecimal.fromString('100'))

      // (payout*365 / stakedValue) * 100% = APR%
      this.investment.grossApr = rewardRate.times(BigDecimal.fromString('365'))

      this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
      this.investment.save()
    }
  }
}
