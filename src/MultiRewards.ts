// import { RewardPaid as RewardEvent } from '../generated/MultiRewards/MultiRewards'
// import { Address, log } from '@graphprotocol/graph-ts'
// import { Transfer } from '../generated/schema'
// import { loadOrCreateTransaction } from './utils/Transactions'
// import { updateTreasuryRevenueDystTransfer, updateTreasuryRevenuePenTransfer } from './utils/TreasuryRevenue'

// import {
//   DAO_WALLET,
//   DAO_WALLET_PENROSE_USER_PROXY,
//   DYSTOPIA_TRACKED_GAUGES,
//   DYST_ERC20,
//   PEN_ERC20,
// } from './utils/Constants'
// import { addressEqualsString } from './utils'

// export function handleRewardPaid(event: RewardEvent): void {
//   if (!addressEqualsString(event.params.user, DAO_WALLET_PENROSE_USER_PROXY)) return

//   let transaction = loadOrCreateTransaction(event.transaction, event.block)
//   let entity = new Transfer(transaction.id)
//   entity.transaction = transaction.id
//   entity.timestamp = transaction.timestamp
//   entity.from = event.params.rewardsToken
//   entity.to = event.params.user
//   entity.value = event.params.reward
//   entity.save()

//   log.debug('DYST Harvest {}, token: {}, to: {}, amt: {}', [
//     event.transaction.hash.toHexString(),
//     event.params.rewardsToken.toHexString(),
//     event.params.user.toHexString(),
//     event.params.reward.toString(),
//   ])
//   //Pass entity to TreasuryRevenue
//   if (addressEqualsString(event.params.rewardsToken, DYST_ERC20)) updateTreasuryRevenueDystTransfer(entity)
//   if (addressEqualsString(event.params.rewardsToken, PEN_ERC20)) updateTreasuryRevenuePenTransfer(entity)
// }
