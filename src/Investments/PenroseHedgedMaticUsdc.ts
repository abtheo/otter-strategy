import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { GAINS_DAI_INVESTMENT_STRATEGY, GAINS_DAI_VAULT, PENROSE_HEDGED_MATIC_STRATEGY } from '../utils/Constants'
import { GainsDaiVault } from '../../generated/OtterClamERC20V2/GainsDaiVault'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { PenroseHedgeLpStrategy } from '../../generated/OtterClamERC20V2/PenroseHedgeLpStrategy'

export class PenroseHedgedMaticUsdcInvestment implements InvestmentInterface {
  public investment!: Investment
  private readonly strategy: string = 'Hedged MATIC/USDC'
  private readonly protocol: string = 'Penrose'
  private readonly startBlock: BigInt = BigInt.fromI32(32513909)

  constructor(transaction: Transaction) {
    let _investment = loadOrCreateInvestment(this.strategy, transaction.timestamp)
    _investment.protocol = this.protocol
    _investment.netAssetValue = this.netAssetValue(transaction.blockNumber)
    this.investment = _investment
    this.investment.save()
  }

  netAssetValue(block: BigInt): BigDecimal {
    if (block.gt(this.startBlock)) {
      return toDecimal(PenroseHedgeLpStrategy.bind(PENROSE_HEDGED_MATIC_STRATEGY).netAssetValue(), 6)
    }
    return BigDecimal.zero()
  }

  addRevenue(claim: ClaimReward): void {
    //aggregate per day
    let dayTotal = this.investment.harvestValue.plus(claim.amountUsd)
    this.investment.harvestValue = dayTotal

    let rewardRate = dayTotal.div(this.netAssetValue(claim.timestamp))
    this.investment.rewardRate = rewardRate

    // (payout*365 / stakedValue) * 100% = APR%
    this.investment.apr = rewardRate.times(BigDecimal.fromString('365')).times(BigDecimal.fromString('100'))

    this.investment.rewardTokens = this.investment.rewardTokens.concat([claim.id])
    this.investment.save()
  }
}
