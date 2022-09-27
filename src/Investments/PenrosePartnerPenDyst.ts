import { Investment, ClaimReward, Transaction } from '../../generated/schema'
import { toDecimal } from '../utils/Decimals'
import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import {
  DAO_WALLET,
  DAO_WALLET_PENROSE_USER_PROXY,
  PENDYST_ERC20,
  PEN_DYST_PARTNER_REWARDS,
  PEN_DYST_REWARD_PROXY,
} from '../utils/Constants'
import { InvestmentInterface, loadOrCreateInvestment } from '.'
import { getPenDystUsdRate } from '../utils/Price'
import { ERC20 } from '../../generated/OtterClamERC20V2/ERC20'
import { PenDystRewards } from '../../generated/OtterClamERC20V2/PenDystRewards'
import { PenrosePartnerRewards } from '../../generated/OtterClamERC20V2/PenrosePartnerRewards'

export class PenrosePartnerPenDystInvestment implements InvestmentInterface {
  public investment!: Investment
  private readonly strategy: string = 'penDYST'
  private readonly protocol: string = 'Penrose'
  private readonly startBlock: BigInt = BigInt.fromI32(29069971) //29069971
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
      let penDyst = ERC20.bind(PENDYST_ERC20)
      let penDystStaking = PenDystRewards.bind(PEN_DYST_REWARD_PROXY)
      let penDystStaking2 = PenrosePartnerRewards.bind(PEN_DYST_PARTNER_REWARDS)

      let penDystAmount = toDecimal(
        penDyst
          .balanceOf(DAO_WALLET)
          .plus(penDyst.balanceOf(DAO_WALLET_PENROSE_USER_PROXY))
          .plus(penDystStaking.balanceOf(DAO_WALLET_PENROSE_USER_PROXY))
          .plus(penDystStaking2.balanceOf(DAO_WALLET_PENROSE_USER_PROXY)),
        18,
      )

      return penDystAmount.times(getPenDystUsdRate())
    }
    return BigDecimal.zero()
  }

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
