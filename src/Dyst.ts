import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { Address, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueDystTransfer } from './utils/TreasuryRevenue'

import { DAO_WALLET, DAO_WALLET_PENROSE_USER_PROXY, DYSTOPIA_TRACKED_GAUGES } from './utils/Constants'
import { addressEqualsString, saveTransfer } from './utils'

export function handleDystTransfer(event: TransferEvent): void {
  if (
    (DYSTOPIA_TRACKED_GAUGES.includes(event.params.from.toHexString()) ||
      addressEqualsString(event.params.from, DAO_WALLET_PENROSE_USER_PROXY)) &&
    event.params.to.toHexString() == DAO_WALLET.toLowerCase()
  ) {
    log.debug('DYST Harvest {}, from: {}, to: {}', [
      event.transaction.hash.toHexString(),
      event.params.from.toHexString(),
      event.params.to.toHexString(),
    ])

    let entity = saveTransfer(event)
    //Pass entity to TreasuryRevenue
    updateTreasuryRevenueDystTransfer(entity)
    entity.save()
  }
}
