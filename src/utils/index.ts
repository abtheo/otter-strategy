import { Address, Bytes } from '@graphprotocol/graph-ts'
import { Transfer as ClamTransferEvent } from '../../generated/OtterClamERC20V2/OtterClamERC20V2'
import { Transfer as sClamTransferEvent } from '../../generated/StakedOtterClamERC20V2/StakedOtterClamERC20V2'
import { Transfer as QiTransferEvent } from '../../generated/Qi/Qi'
import { Transfer as DystTransferEvent } from '../../generated/Dyst/Dyst'
import { Transfer as DystPairTransferEvent } from '../../generated/DystPairFactory/DystPair'
import { Transfer as PenTransferEvent } from '../../generated/Pen/Pen'
import { Transfer } from '../../generated/schema'
import { loadOrCreateTransaction } from './Transactions'

export function addressEqualsString(address1: Address, address2: string): boolean {
  return address1.toHexString().toLowerCase() == address2.toLowerCase()
}
export function bytesEqualsString(address1: Bytes, address2: string): boolean {
  return address1.toHexString().toLowerCase() == address2.toLowerCase()
}

export function saveTransfer(
  event:
    | ClamTransferEvent
    | sClamTransferEvent
    | QiTransferEvent
    | DystTransferEvent
    | DystPairTransferEvent
    | PenTransferEvent,
): any {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Transfer(transaction.id)
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()

  return entity
}
