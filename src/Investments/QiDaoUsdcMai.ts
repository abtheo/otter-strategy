import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { MAI_USDC_INVESTMENT_STRATEGY, QI_FARM_V3, UNI_MAI_USDC_PAIR } from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { QiFarmV3 } from '../../generated/OtterClamERC20V2/QiFarmV3'
import { getUniPairUSD } from '../utils/Price'

export class QiDaoUsdcMaiInvestment implements InvestmentInterface {
  public investment!: Investment
  private readonly strategy: string = 'USDC/MAI'
  private readonly protocol: string = 'QiDAO'
  private readonly startBlock: BigInt = BigInt.fromI32(23932247)
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
    if (this.currentBlock.gt(this.startBlock)) {
      let farm = QiFarmV3.bind(QI_FARM_V3)
      //pid 0 == mai/usdc
      let deposited = farm.deposited(BigInt.zero(), MAI_USDC_INVESTMENT_STRATEGY)
      return getUniPairUSD(this.currentBlock, deposited, UNI_MAI_USDC_PAIR)
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
