import { BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import { Transfer as TransferEvent } from '../generated/OtterClamERC20V2/OtterClamERC20V2'
import { log } from '@graphprotocol/graph-ts'
import { loadOrCreateTransaction } from './utils/Transactions'
import { getClamUsdRate } from './utils/Price'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function handleTransfer(event: TransferEvent): void {
  //BURN events
  if (event.params.to.toHexString() == '0x0000000000000000000000000000000000000000') {
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

    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    updateProtocolMetrics(transaction)
  }
}
