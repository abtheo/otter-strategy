import { Address, log, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { Transfer, DystopiaGaugeBalance } from '../generated/schema'
import { Transfer as TransferEvent } from '../generated/Dyst/DystPair'
import { loadOrCreateTransaction } from './utils/Transactions'

import { toDecimal } from './utils/Decimals'
import { DAO_WALLET, DAO_WALLET_PENROSE_USER_PROXY, DYSTOPIA_TRACKED_GAUGES, PENROSE_PROXY } from './utils/Constants'
import { dataSource } from '@graphprotocol/graph-ts'
import { addressEqualsString, saveTransfer } from './utils'

/*
Dystopia LP Staking does not return any vested tokens to the DAO.
Therefore we need to track withdraws and Transfers made by the DAO wallet
in a cumulative counter.

DystPairs are dynamically created from a template in the subgraph.yaml
Possible LPs:
1. CLAM/MAI
2. CLAM/USD+
3. USDC/MAI
4. USDC/FRAX
5. DYST/MATIC
*/
export function handleTransfer(event: TransferEvent): void {
  //only track DAO txs
  if (
    event.params.from.toHexString() != DAO_WALLET.toLowerCase() &&
    event.params.to.toHexString() != DAO_WALLET.toLowerCase()
  )
    return

  let context = dataSource.context()
  let pair = context.getString('pair')

  saveTransfer(event)
  //update LP balance
  let dystLp = loadOrCreateDystopiaGaugeBalance(Address.fromString(pair))
  if (
    addressEqualsString(event.params.from, DAO_WALLET) &&
    (DYSTOPIA_TRACKED_GAUGES.includes(event.params.to.toHexString()) ||
      addressEqualsString(event.params.to, DAO_WALLET_PENROSE_USER_PROXY) ||
      addressEqualsString(event.params.to, PENROSE_PROXY))
  ) {
    //deposit
    dystLp.balance = dystLp.balance.plus(event.params.value)
    dystLp.save()
  }
  if (
    addressEqualsString(event.params.to, DAO_WALLET) &&
    (DYSTOPIA_TRACKED_GAUGES.includes(event.params.from.toHexString()) ||
      addressEqualsString(event.params.from, DAO_WALLET_PENROSE_USER_PROXY) ||
      addressEqualsString(event.params.from, PENROSE_PROXY))
  ) {
    //withdraw
    dystLp.balance = dystLp.balance.minus(event.params.value)
    dystLp.save()
  }

  log.debug('Transfered Dystopia LP Gauge in TX: {}, LP: {} Amount {}, from: {}, to: {}, balance: {}', [
    event.transaction.hash.toHexString(),
    pair,
    event.params.value.toString(),
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    dystLp.balance.toString(),
  ])
}

export function loadOrCreateDystopiaGaugeBalance(lpAddress: Address): DystopiaGaugeBalance {
  let dystLp = DystopiaGaugeBalance.load(lpAddress.toHexString())
  if (dystLp == null) {
    dystLp = new DystopiaGaugeBalance(lpAddress.toHexString())
    dystLp.balance = BigInt.fromString('0')
    dystLp.save()
  }
  return dystLp as DystopiaGaugeBalance
}
