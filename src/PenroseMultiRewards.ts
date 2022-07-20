import { Transfer } from '../generated/schema'
import { RewardAdded, RewardPaid } from '../generated/PenroseMultiRewards/PenroseMultiRewards'
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
  log.debug('Handle Penrose Multi rewards  {} {} {}', [
    event.params.reward.toString(),
    event.params.rewardsToken.toHexString(),
    event.params.user.toHexString(),
  ])

  let transaction = loadOrCreateTransaction(event.transaction, event.block)

  if (event.params.rewardsToken == DYST_ERC20) {
    log.warning('DYST REVENUE {}', [event.params.reward.toString()])
    updateTreasuryRevenueDystRewardPaid(transaction, event.params.reward)
  }
  if (event.params.rewardsToken == PEN_ERC20) {
    log.warning('PEN REVENUE {}', [event.params.reward.toString()])
    updateTreasuryRevenuePenRewardPaid(transaction, event.params.reward)
  }
  if (event.params.rewardsToken == PENDYST_ERC20) {
    log.warning('PENDYST REVENUE {}', [event.params.reward.toString()])
    updateTreasuryRevenuePenDystRewardPaid(transaction, event.params.reward)
  }
}
