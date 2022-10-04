import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { MAI_USDC_INVESTMENT_STRATEGY, QI_FARM_V3, UNI_MAI_USDC_PAIR } from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { QiFarmV3 } from '../../generated/OtterClamERC20V2/QiFarmV3'
import { getUniPairUSD } from '../utils/Price'

export class QiDaoUsdcMaiInvestment implements InvestmentInterface {
  public investment!: Investment
  public readonly strategy: string = 'USDC/MAI'
  public readonly protocol: string = 'QiDAO'
  public readonly startBlock: BigInt = BigInt.fromI32(31831179)
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
      let farm = QiFarmV3.bind(QI_FARM_V3)
      //pid 0 == mai/usdc
      let deposited = farm.deposited(BigInt.zero(), MAI_USDC_INVESTMENT_STRATEGY)
      return getUniPairUSD(this.currentBlock, deposited, UNI_MAI_USDC_PAIR)
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
