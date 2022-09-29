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

  constructor(transaction: Transaction) {
    this.currentBlock = transaction.blockNumber
    if (transaction.blockNumber.ge(this.startBlock)) {
      let nav = this.netAssetValue()
      if (nav.gt(BigDecimal.fromString('10'))) {
        let _investment = loadOrCreateInvestment(this.strategy, transaction.timestamp)
        _investment.protocol = this.protocol
        _investment.netAssetValue = nav
        this.investment = _investment
        this.investment.save()
      }
    }
  }

  netAssetValue(): BigDecimal {
    if (this.currentBlock.gt(this.startBlock)) {
      let tryNAV = UniV3UsdcMaiStrategy.bind(UNIV3_USDC_MAI_STRATEGY).try_netAssetValue()
      let netAssetVal = tryNAV.reverted ? BigInt.zero() : tryNAV.value

      return toDecimal(netAssetVal, 6)
    }
    return BigDecimal.zero()
  }

  // Uses the Gross Revenue for Farming APR
  addRevenue(claim: ClaimReward): void {
    //aggregate per day
    let dayTotal = this.investment.grossRevenue.plus(claim.amountUsd)
    this.investment.grossRevenue = dayTotal

    let rewardRate = dayTotal.div(this.netAssetValue()).times(BigDecimal.fromString('100'))

    // (payout*365 / stakedValue) * 100% = APR%
    this.investment.grossApr = rewardRate.times(BigDecimal.fromString('365'))

    this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
    this.investment.save()
  }

  // Uses the Net Revenue for PnL (APR?)
  // In this case we can use the PayoutReward of the Strategy
  // For others, construct PayoutReward manually
  calculateNetProfit(payout: PayoutReward): void {
    //aggregate per day
    let dayTotal = this.investment.grossRevenue.plus(payout.revenue)
    this.investment.netRevenue = dayTotal

    let rewardRate = dayTotal.div(this.netAssetValue()).times(BigDecimal.fromString('100'))

    // (payout*365 / stakedValue) * 100% = APR%
    this.investment.netApr = rewardRate.times(BigDecimal.fromString('365'))

    // this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
    this.investment.save()
  }
}
