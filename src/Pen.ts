import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { Address, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenuePenTransfer } from './utils/TreasuryRevenue'
import { addressEqualsString } from './utils'
import { DAO_WALLET, DAO_WALLET_PENROSE_USER_PROXY } from './utils/Constants'

export function handlePenTransfer(event: TransferEvent): void {
  if (event.params.from == DAO_WALLET_PENROSE_USER_PROXY && event.params.to == DAO_WALLET) {
    log.debug('Penrose Harvest {}, from: {}, to: {}', [
      event.transaction.hash.toHexString(),
      event.params.from.toHexString(),
      event.params.to.toHexString(),
    ])
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let entity = new Transfer(transaction.id)
    entity.transaction = transaction.id
    entity.timestamp = transaction.timestamp
    entity.from = event.params.from
    entity.to = event.params.to
    entity.value = event.params.value
    entity.save()

    //Pass entity to TreasuryRevenue
    updateTreasuryRevenuePenTransfer(entity)
  }
}
