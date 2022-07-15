import { BigDecimal } from '@graphprotocol/graph-ts';
import { CumulativeValues } from '../../generated/schema'

export function loadCumulativeValues(): CumulativeValues {
    let values = CumulativeValues.load('CumulativeValues')
    if (!values) {
        values = new CumulativeValues('CumulativeValues')
        values.rewardPayoutMarketValue = BigDecimal.zero()
        values.clamPondDepositedAmount = BigDecimal.zero()
    }
    return values
}