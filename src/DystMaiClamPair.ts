import { Address, log, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Transfer, DystopiaLPBalance } from '../generated/schema'
import { Transfer as TransferEvent } from '../generated/DystMaiClamPair/DystPair'
import { loadOrCreateTransaction } from './utils/Transactions'

import { toDecimal } from './utils/Decimals'
import { DAO_WALLET, DYSTOPIA_MAI_CLAM_GAUGE, DYSTOPIA_PAIR_MAI_CLAM, DYSTOPIA_REWARDS } from './utils/Constants'

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
  if (event.params.to.toHexString() == DYSTOPIA_MAI_CLAM_GAUGE.toLowerCase()) {
    //deposit
    dystLp.balance = dystLp.balance.plus(event.params.value)
    dystLp.save()
  }
  if (event.params.from.toHexString() == DYSTOPIA_MAI_CLAM_GAUGE.toLowerCase()) {
    //withdraw
    dystLp.balance = dystLp.balance.minus(event.params.value)
    dystLp.save()
  }

  log.debug('Transfered to Dystopia MAI-CLAM LP Gauge in TX: {}, LP: {} Amount {}, from: {}, to: {}', [
    transaction.id,
    DYSTOPIA_MAI_CLAM_GAUGE,
    event.params.value.toString(),
    event.params.from.toHexString(),
    event.params.to.toHexString(),
  ])
}

export function loadOrCreateDystopiaLPBalance(lpAddress: Address): DystopiaLPBalance {
  let dystLp = DystopiaLPBalance.load(lpAddress.toHexString())
  if (dystLp == null) {
    dystLp = new DystopiaLPBalance(lpAddress.toHexString())
    dystLp.balance = BigInt.fromString('0')
    dystLp.save()
  }

  return dystLp as DystopiaLPBalance
}
