import { Investment, ClaimReward, PayoutReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { UNIV3_USDC_MAI_STRATEGY } from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { UniV3UsdcMaiStrategy } from '../../generated/UniV3UsdcMaiStrategy/UniV3UsdcMaiStrategy'

export class UniV3UsdcMaiInvestment implements InvestmentInterface {
  public investment!: Investment
  public readonly strategy: string = 'USDC/MAI'
  public readonly protocol: string = 'Uniswap V3'
  public readonly startBlock: BigInt = BigInt.fromI32(33379248)
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
      let tryNAV = UniV3UsdcMaiStrategy.bind(UNIV3_USDC_MAI_STRATEGY).try_netAssetValue()
      let netAssetVal = tryNAV.reverted ? BigInt.zero() : tryNAV.value

      return toDecimal(netAssetVal, 6)
    }
    return BigDecimal.zero()
  }

  // Calculate the Gross Revenue from farmed tokens
  addRevenue(claim: ClaimReward): void {
    if (this.active) {
      //aggregate per day
      let dayTotal = this.investment.grossRevenue.plus(claim.amountUsd)
      this.investment.grossRevenue = dayTotal

      // (payout / stakedValue) * 365days * 100% = APR%
      let rewardRate = dayTotal.div(this.netAssetValue()).times(BigDecimal.fromString('100'))
      this.investment.grossApr = rewardRate.times(BigDecimal.fromString('365'))

      this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
      this.investment.save()
    }
  }

  // Calculate Net Revenue / APR
  // In this case we can use the PayoutReward of the Strategy
  // For others, construct PayoutReward manually
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
