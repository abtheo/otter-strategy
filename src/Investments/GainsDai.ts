import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { GAINS_DAI_INVESTMENT_STRATEGY, GAINS_DAI_VAULT } from '../utils/Constants'
import { GainsDaiVault } from '../../generated/OtterClamERC20V2/GainsDaiVault'
import { InvestmentInterface, loadOrCreateInvestment } from '.'

export class GainsDaiInvestment implements InvestmentInterface {
  public investment!: Investment
  public readonly strategy: string = 'DAI Vault'
  public readonly protocol: string = 'Gains'
  public readonly startBlock: BigInt = BigInt.fromI32(32300283)
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
      let gainsDaiVault = GainsDaiVault.bind(GAINS_DAI_VAULT)
      // values: daiDeposited uint256, maxDaiDeposited uint256, withdrawBlock uint256, debtDai uint256, debtMatic uint256
      let gainsDaiBalance = toDecimal(gainsDaiVault.users(GAINS_DAI_INVESTMENT_STRATEGY).value0, 18)

      return gainsDaiBalance
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
