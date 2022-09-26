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
      let _investment = loadOrCreateInvestment(this.strategy, transaction.timestamp)
      let nav = this.netAssetValue()
      _investment.protocol = this.protocol
      _investment.netAssetValue = nav
      _investment.active = nav.ge(BigDecimal.fromString('10'))
      this.investment = _investment
      this.investment.save()
    }
  }

  netAssetValue(): BigDecimal {
    if (this.currentBlock.ge(this.startBlock)) {
      return toDecimal(PenroseHedgeLpStrategy.bind(PENROSE_HEDGED_MATIC_STRATEGY).netAssetValue(), 6)
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
