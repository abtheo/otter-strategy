import { BigDecimal } from '@graphprotocol/graph-ts'
import { TotalBurnedClam } from '../../generated/schema'

export function loadOrCreateTotalBurnedClamSingleton(): TotalBurnedClam {
  let total = TotalBurnedClam.load('1')
  if (total == null) {
    total = new TotalBurnedClam('1')
    /*Polygon chain does not support Call handler tracing, so we can't use CLAM's burn function :(
    To avoid tracking all CLAM transfers and slowing the graph,
    manually include the untrackable burn transactions done in the past.
    Buyback & Burn Transactions:
    - https://polygonscan.com/tx/0xa5d6ac2fed50f1d71b30dda8b61bc94349283301e46e26f63303d991243407fd 3577 CLAM @ $13,611
    - https://polygonscan.com/tx/0x77996f5439a04b4705d8fb18176945411318578ded2b5ee9c36c4cf4c2114886 439 @ $1154

    Dune query to verify historical burns: https://dune.com/queries/1066673
    Otto Portal (before tracking enabled in contract upgrade) evt_block_number < 30747603
    - Total 565 CLAM @ $1300

    Clam Pond (before tracking enabled in contract upgrade) evt_block_number < 30969890
    - Total 59 @ $92

    13,611 + 1154 + 1300 + 92 = $16,197
    3577 + 439 + 565 + 59 = 4640
    */
    total.burnedClam = BigDecimal.fromString('4640')
    total.burnedValueUsd = BigDecimal.fromString('16197')
    total.clamPondTotal = BigDecimal.zero()
    total.save()
  }
  return total
}
