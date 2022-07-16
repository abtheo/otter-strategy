// import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
// import {
//   LogRebase as LogRebaseEvent,
//   Transfer as TransferEvent,
// } from '../generated/StakedOtterClamERC20V2/StakedOtterClamERC20V2'
// import { LogRebase, Transfer } from '../generated/schema'
// import { log } from '@graphprotocol/graph-ts'
// import { loadOrCreateTransaction } from './utils/Transactions'
// import { updateProtocolMetrics } from './utils/ProtocolMetrics'

// export function handleLogRebase(event: LogRebaseEvent): void {
//   let transaction = loadOrCreateTransaction(event.transaction, event.block)
//   let entity = new LogRebase(transaction.id)
//   entity.epoch = event.params.epoch
//   entity.rebase = event.params.rebase
//   entity.index = event.params.index
//   entity.timestamp = transaction.timestamp
//   entity.transaction = transaction.id
//   entity.save()
//   updateProtocolMetrics(transaction)
// }

// export function handleTransfer(event: TransferEvent): void {
//   let transaction = loadOrCreateTransaction(event.transaction, event.block)
//   let entity = new Transfer(transaction.id)
//   entity.transaction = transaction.id
//   entity.timestamp = transaction.timestamp
//   entity.from = event.params.from
//   entity.to = event.params.to
//   entity.value = event.params.value
//   entity.save()
//   updateProtocolMetrics(transaction)
// }
