import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { PENROSE_HEDGED_MATIC_STRATEGY } from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { PenroseHedgeLpStrategy } from '../../generated/OtterClamERC20V2/PenroseHedgeLpStrategy'

export class PenroseHedgedMaticUsdcInvestment implements InvestmentInterface {
  public investment!: Investment
  private readonly strategy: string = 'Hedged MATIC/USDC'
  private readonly protocol: string = 'Penrose'
  private readonly startBlock: BigInt = BigInt.fromI32(33348683) // actual start: 32513909
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
    if (this.currentBlock.ge(this.startBlock)) {
      return toDecimal(PenroseHedgeLpStrategy.bind(PENROSE_HEDGED_MATIC_STRATEGY).netAssetValue(), 6)
    }
    return BigDecimal.zero()
  }

  addRevenue(claim: ClaimReward): void {
    if (this.currentBlock.ge(this.startBlock)) {
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
