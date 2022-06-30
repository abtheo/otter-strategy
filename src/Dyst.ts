import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { Address, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueDystTransfer } from './utils/TreasuryRevenue'
import { DAO_WALLET, DAO_WALLET_PENROSE_USER_PROXY, DYSTOPIA_TRACKED_GAUGES } from './utils/Constants'

export function handleDystTransfer(event: TransferEvent): void {
  if (
    (DYSTOPIA_TRACKED_GAUGES.includes(event.params.from) || event.params.from == DAO_WALLET_PENROSE_USER_PROXY) &&
    event.params.to == DAO_WALLET
  ) {
    log.debug('DYST Harvest {}, from: {}, to: {}', [
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

    //Pass entity to TreasuryRevenue
    updateTreasuryRevenueDystTransfer(entity)
    entity.save()
  }
}
