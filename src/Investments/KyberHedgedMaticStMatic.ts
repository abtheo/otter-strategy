import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { KYBERSWAP_HEDGED_MATIC_STMATIC_STRATEGY } from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { KyberswapMaticStMaticHedgedLpStrategy } from '../../generated/KyberswapMaticStMaticHedgedLpStrategy/KyberswapMaticStMaticHedgedLpStrategy'

export class KyberHedgedMaticStMaticInvestment implements InvestmentInterface {
  public investment!: Investment
  private readonly strategy: string = 'Hedged MATIC/stMATIC'
  private readonly protocol: string = 'Kyberswap'
  private readonly startBlock: BigInt = BigInt.fromI32(33348683) //actual: 33084754
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
    if (this.currentBlock.ge(this.startBlock)) {
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
}
