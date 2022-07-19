import { Transfer } from '../generated/schema'
import { RewardPaid } from '../generated/PenroseMultiRewards/PenroseMultiRewards'
import { DAO_WALLET_PENROSE_USER_PROXY, DYST_ERC20, PEN_ERC20 } from './utils/Constants'
import { updateTreasuryRevenueDystTransfer, updateTreasuryRevenuePenTransfer } from './utils/TreasuryRevenue'
import { loadOrCreateTransaction } from './utils/Transactions'

export function handleRewardPaid(event: RewardPaid): void {
  if (event.params.user != DAO_WALLET_PENROSE_USER_PROXY) return

  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let transfer = new Transfer(transaction.id)
  transfer.transaction = transaction.id
  transfer.value = event.params.reward
  transfer.save()

  if (event.params.rewardsToken == DYST_ERC20) {
    updateTreasuryRevenueDystTransfer(event.block.number, transfer)
  }
  if (event.params.rewardsToken == PEN_ERC20) {
    updateTreasuryRevenuePenTransfer(event.block.number, transfer)
  }
}
