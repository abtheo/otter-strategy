import { RewardPaid } from '../generated/PenrosePartnerRewards/PenroseMultiRewards'
import {
  DAO_WALLET_PENROSE_USER_PROXY,
  DYST_ERC20,
  PENDYST_ERC20,
  PENROSE_REWARD_USDPLUS_CLAM,
  PEN_DYST_PARTNER_REWARDS,
  PEN_ERC20,
} from './utils/Constants'
import {
  updateTreasuryRevenueDystRewardPaid,
  updateTreasuryRevenuePenDystRewardPaid,
  updateTreasuryRevenuePenRewardPaid,
} from './utils/TreasuryRevenue'
import { loadOrCreateTransaction } from './utils/Transactions'
import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { PenroseClamUsdPlusInvestment } from './Investments/PenroseClamUsdplus'
import { ClaimReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { getDystUsdRate, getPenDystUsdRate, getPenUsdRate } from './utils/Price'
import { PenrosePartnerPenDystInvestment } from './Investments/PenrosePartnerPenDyst'

export function handleRewardPaid(event: RewardPaid): void {
  if (event.params.user != DAO_WALLET_PENROSE_USER_PROXY) return
  log.debug('Penrose Multi rewards: amount {} of token {} to user {} using address {} from {} ', [
    event.params.reward.toString(),
    event.params.rewardsToken.toHexString(),
    event.params.user.toHexString(),
    event.address.toHexString(),
    event.transaction.from.toHexString(),
  ])

  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let price = BigDecimal.zero()
  if (event.params.rewardsToken == DYST_ERC20) {
    updateTreasuryRevenueDystRewardPaid(transaction, event.params.reward)
    price = getDystUsdRate()
  }
  if (event.params.rewardsToken == PEN_ERC20) {
    updateTreasuryRevenuePenRewardPaid(transaction, event.params.reward)
    price = getPenUsdRate()
  }
  if (event.params.rewardsToken == PENDYST_ERC20) {
    updateTreasuryRevenuePenDystRewardPaid(transaction, event.params.reward)
    price = getPenDystUsdRate()
  }

  // Investments tracking
  let claim = new ClaimReward(
    `${event.address.toHexString()}_${transaction.id}_${event.params.rewardsToken.toHexString()}`,
  )
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.reward, 18).times(price)
  claim.amountToken = toDecimal(event.params.reward, 18)
  claim.token = event.params.rewardsToken
  claim.save()

  if (event.address == PENROSE_REWARD_USDPLUS_CLAM) {
    let investment = new PenroseClamUsdPlusInvestment(transaction)
    investment.addRevenue(claim)
  }
  //Penrose Partnership includes a lot of dust, ignore
  if (event.address == PEN_DYST_PARTNER_REWARDS && price.gt(BigDecimal.zero())) {
    let investment = new PenrosePartnerPenDystInvestment(transaction)
    investment.addRevenue(claim)
  }
}
