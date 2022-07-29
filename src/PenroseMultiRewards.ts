import { RewardPaid } from '../generated/PenrosePartnerRewards/PenroseMultiRewards'
import { DAO_WALLET_PENROSE_USER_PROXY, DYST_ERC20, PENDYST_ERC20, PEN_ERC20 } from './utils/Constants'
import {
  updateTreasuryRevenueDystRewardPaid,
  updateTreasuryRevenuePenDystRewardPaid,
  updateTreasuryRevenuePenRewardPaid,
} from './utils/TreasuryRevenue'
import { loadOrCreateTransaction } from './utils/Transactions'
import { log } from '@graphprotocol/graph-ts'

export function handleRewardPaid(event: RewardPaid): void {
  if (event.params.user != DAO_WALLET_PENROSE_USER_PROXY) return
  log.debug('Handle Penrose Multi rewards: amount {} of token {} to user {}', [
    event.params.reward.toString(),
    event.params.rewardsToken.toHexString(),
    event.params.user.toHexString(),
  ])

  let transaction = loadOrCreateTransaction(event.transaction, event.block)

  if (event.params.rewardsToken == DYST_ERC20) {
    updateTreasuryRevenueDystRewardPaid(transaction, event.params.reward)
  }
  if (event.params.rewardsToken == PEN_ERC20) {
    updateTreasuryRevenuePenRewardPaid(transaction, event.params.reward)
  }
  if (event.params.rewardsToken == PENDYST_ERC20) {
    updateTreasuryRevenuePenDystRewardPaid(transaction, event.params.reward)
  }
}
