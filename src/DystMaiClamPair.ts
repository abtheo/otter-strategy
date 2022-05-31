import { Address, log, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Transfer, DystopiaLPBalance } from '../generated/schema'
import { Transfer as TransferEvent } from '../generated/DystMaiClamPair/DystPair'
import { loadOrCreateTransaction } from './utils/Transactions'

import { toDecimal } from './utils/Decimals'
import { DAO_WALLET, DYSTOPIA_REWARDS, DYSTOPIA_PAIR_MAI_CLAM } from './utils/Constants'

/*
Dystopia LP Staking does not return any vested tokens to the DAO.
Therefore we need to track withdraws and Transfers made by the DAO wallet
in a cumulative counter.
*/
export function handleTransfer(event: TransferEvent): void {
  //only track DAO txs
  if (
    event.params.from.toHexString().toLowerCase() != DAO_WALLET.toLowerCase() &&
    event.params.to.toHexString().toLowerCase() != DAO_WALLET.toLowerCase()
  )
    return

  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Transfer(transaction.id)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.save()
  //update LP balance
  let dystLp = loadOrCreateDystopiaLPBalance(Address.fromString(DYSTOPIA_PAIR_MAI_CLAM))
  if (
    event.params.from.toHexString().toLowerCase() == DAO_WALLET.toLowerCase() &&
    event.params.to.toHexString().toLowerCase() == DYSTOPIA_REWARDS.toLowerCase()
  ) {
    //deposit
    dystLp.balance = dystLp.balance.plus(event.params.value)
    dystLp.save()
  }
  if (
    event.params.from.toHexString().toLowerCase() == DYSTOPIA_REWARDS.toLowerCase() &&
    event.params.to.toHexString().toLowerCase() == DAO_WALLET.toLowerCase()
  ) {
    //withdraw
    dystLp.balance = dystLp.balance.minus(event.params.value)
    dystLp.save()
  }

  log.debug('Transfered Dystopia MAI-CLAM LP Gauge in TX: {}, LP: {} Amount {}, from: {}, to: {}, balance: {}', [
    transaction.id,
    DYSTOPIA_REWARDS,
    event.params.value.toString(),
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    dystLp.balance.toString(),
  ])
}

export function loadOrCreateDystopiaLPBalance(lpAddress: Address): DystopiaLPBalance {
  let dystLp = DystopiaLPBalance.load(lpAddress.toHexString().toLowerCase())
  if (dystLp == null) {
    dystLp = new DystopiaLPBalance(lpAddress.toHexString().toLowerCase())
    dystLp.balance = BigInt.fromString('0')
    dystLp.save()
  }

  return dystLp as DystopiaLPBalance
}
