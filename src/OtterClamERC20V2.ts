import { BurnCall } from '../generated/OtterClamERC20V2/OtterClamERC20V2'
import { loadOrCreateTotalBurnedClamSingleton } from './utils/Burned'
import { toDecimal } from './utils/Decimals'
import { getClamUsdRate } from './utils/Price'

export function handleBurn(burnCall: BurnCall) {
  let burns = loadOrCreateTotalBurnedClamSingleton()

  burns.burnedClam = burns.burnedClam.plus(toDecimal(burnCall.inputs.amount, 9))
  burns.burnedValueUsd = burns.burnedValueUsd.plus(
    toDecimal(burnCall.inputs.amount, 9).times(getClamUsdRate(burnCall.block.number)),
  )
  burns.save()
}
