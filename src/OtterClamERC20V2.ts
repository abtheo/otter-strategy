import { BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import { Transfer as TransferEvent } from '../generated/OtterClamERC20V2/OtterClamERC20V2'
import { Transfer } from '../generated/schema'
import { log } from '@graphprotocol/graph-ts'
import { loadOrCreateTransaction } from './utils/Transactions'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'

export function handleTransfer(event: TransferEvent): void {
  //BURN events
  if (event.params.to.toHexString() == '0x0000000000000000000000000000000000000000') {
    saveTransfer(event)

    let burnedClam = event.params.value.divDecimal(BigDecimal.fromString('1e9'))
    log.debug('Burned CLAM {} at block {}, txid {}', [
      burnedClam.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
    ])

    //Cumulative total for burned CLAM
    let total = loadOrCreateTotalBurnedClamSingleton()
    total.burnedClam = total.burnedClam.plus(burnedClam)
    total.burnedValueUsd = total.burnedValueUsd.plus(getClamUsdRate(event.block.number).times(burnedClam))
    total.save()
  }
}

function saveTransfer(event: TransferEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Transfer(transaction.id)
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
}
