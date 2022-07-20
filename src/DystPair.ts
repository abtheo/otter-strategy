// import { Address, log, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
// import { Transfer, DystopiaGaugeBalance } from '../generated/schema'
// import { Transfer as TransferEvent } from '../generated/OtterQiLocker/DystPair'
// import { loadOrCreateTransaction } from './utils/Transactions'
// import { DAO_WALLET, DAO_WALLET_PENROSE_USER_PROXY, PENROSE_PROXY } from './utils/Constants'
// import { dataSource } from '@graphprotocol/graph-ts'

// /*
// Dystopia LP Staking does not return any vested tokens to the DAO.
// Therefore we need to track withdraws and Transfers made by the DAO wallet
// in a cumulative counter.

// DystPairs are dynamically created from a template in the subgraph.yaml
// */
// export function handleTransfer(event: TransferEvent): void {
//   //only track DAO txs
//   if (event.params.from != DAO_WALLET && event.params.to != DAO_WALLET) return

//   let context = dataSource.context()
//   let pair = context.getString('pair')

//   let transaction = loadOrCreateTransaction(event.transaction, event.block)
//   let entity = new Transfer(transaction.id)
//   entity.transaction = transaction.id
//   entity.timestamp = transaction.timestamp
//   entity.from = event.params.from
//   entity.to = event.params.to
//   entity.value = event.params.value

//   entity.save()
//   //update LP balance
//   let dystLp = loadOrCreateDystopiaGaugeBalance(Address.fromString(pair))
//   if (
//     event.params.from == DAO_WALLET &&
//     (event.params.to == DAO_WALLET_PENROSE_USER_PROXY || event.params.to == PENROSE_PROXY)
//   ) {
//     //deposit
//     dystLp.balance = dystLp.balance.plus(event.params.value)
//     dystLp.save()
//   }
//   if (
//     event.params.to == DAO_WALLET &&
//     (event.params.from == DAO_WALLET_PENROSE_USER_PROXY || event.params.from == PENROSE_PROXY)
//   ) {
//     //withdraw
//     dystLp.balance = dystLp.balance.minus(event.params.value)
//     dystLp.save()
//   }

//   log.debug('Transfered Dystopia LP Gauge in TX: {}, LP: {} Amount {}, from: {}, to: {}, balance: {}', [
//     transaction.id,
//     pair,
//     event.params.value.toString(),
//     event.params.from.toHexString(),
//     event.params.to.toHexString(),
//     dystLp.balance.toString(),
//   ])
// }

// export function loadOrCreateDystopiaGaugeBalance(lpAddress: Address): DystopiaGaugeBalance {
//   let dystLp = DystopiaGaugeBalance.load(lpAddress.toHexString())
//   if (dystLp == null) {
//     dystLp = new DystopiaGaugeBalance(lpAddress.toHexString())
//     dystLp.balance = BigInt.fromString('0')
//     dystLp.save()
//   }

//   return dystLp as DystopiaGaugeBalance
// }
