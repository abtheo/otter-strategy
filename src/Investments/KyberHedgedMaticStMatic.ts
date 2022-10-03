import { Investment, ClaimReward, Transaction, PayoutReward } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { KYBERSWAP_HEDGED_MATIC_STMATIC_STRATEGY } from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { KyberswapMaticStMaticHedgedLpStrategy } from '../../generated/KyberswapMaticStMaticHedgedLpStrategy/KyberswapMaticStMaticHedgedLpStrategy'

export class KyberHedgedMaticStMaticInvestment implements InvestmentInterface {
  public investment!: Investment
  public readonly strategy: string = 'Hedged MATIC/stMATIC'
  public readonly protocol: string = 'Kyberswap'
  public readonly startBlock: BigInt = BigInt.fromI32(33348683) //actual: 33084754
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
      let tryNAV = KyberswapMaticStMaticHedgedLpStrategy.bind(
        KYBERSWAP_HEDGED_MATIC_STMATIC_STRATEGY,
      ).try_netAssetValue()
      let netAssetVal = tryNAV.reverted ? BigInt.zero() : tryNAV.value

      return toDecimal(netAssetVal, 6)
    }
    return BigDecimal.zero()
  }

  // Uses the Gross Revenue for Farming APR
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
  calculateNetProfit(payout: PayoutReward): void {
    if (this.active) {
      //aggregate per day
      let dayTotal = this.investment.netRevenue.plus(payout.revenue)
      this.investment.netRevenue = dayTotal

      let rewardRate = dayTotal.div(this.netAssetValue()).times(BigDecimal.fromString('100'))

      // (payout*365 / stakedValue) * 100% = APR%
      this.investment.netApr = rewardRate.times(BigDecimal.fromString('365'))

      // this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
      this.investment.save()
    }
  }
}
