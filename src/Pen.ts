import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { log } from '@graphprotocol/graph-ts'
import { updateTreasuryRevenuePenTransfer } from './utils/TreasuryRevenue'
import { addressEqualsString, saveTransfer } from './utils'
import { DAO_WALLET, DAO_WALLET_PENROSE_USER_PROXY } from './utils/Constants'

export function handlePenTransfer(event: TransferEvent): void {
  if (
    addressEqualsString(event.params.from, DAO_WALLET_PENROSE_USER_PROXY) &&
    addressEqualsString(event.params.to, DAO_WALLET)
  ) {
    log.debug('Penrose Harvest {}, from: {}, to: {}', [
      event.transaction.hash.toHexString(),
      event.params.from.toHexString(),
      event.params.to.toHexString(),
    ])
    let entity = saveTransfer(event)

    //Pass entity to TreasuryRevenue
    updateTreasuryRevenuePenTransfer(entity)
  }
}
