import { BigDecimal } from '@graphprotocol/graph-ts'
import { TotalBurnedClam } from '../../generated/schema'

export function loadOrCreateTotalBurnedClamSingleton(): TotalBurnedClam {
  let total = TotalBurnedClam.load('1')
  if (total == null) {
    total = new TotalBurnedClam('1')
    total.burnedClam = BigDecimal.zero()
    total.burnedValueUsd = BigDecimal.zero()
  }
  return total
}
