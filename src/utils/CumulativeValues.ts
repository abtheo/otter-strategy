import { BigDecimal } from '@graphprotocol/graph-ts'
import { CumulativeValues } from '../../generated/schema'

export function loadCumulativeValues(): CumulativeValues {
  let values = CumulativeValues.load('CumulativeValues')
  if (values == null) {
    values = new CumulativeValues('CumulativeValues')
    values.rewardPayoutMarketValue = BigDecimal.zero()
    values.save()
  }
  return values
}
