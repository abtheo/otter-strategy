import { Payout } from '../generated/OtterRewardManager/OtterRewardManager'
import { OtterClamERC20V2 } from '../generated/OtterRewardManager/OtterClamERC20V2'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_ERC20, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'
import { getClamUsdRate } from './utils/Price'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export function handlePayout(payout: Payout): void {
  let clam = OtterClamERC20V2.bind(CLAM_ERC20)
  let pearlBank = PearlBank.bind(PEARL_BANK)

  let clamPrice = getClamUsdRate(payout.block.number)

  let maybe_totalStaked = pearlBank.try_totalStaked()
  if (maybe_totalStaked.reverted) return
  let totalStaked = maybe_totalStaked.reverted ? BigInt.zero() : maybe_totalStaked.value
  let stakedMarketValue = clamPrice.times(toDecimal(totalStaked, 9))

  // update cumulative values
  let cumulativeValues = loadCumulativeValues()
  let metric = loadOrCreatePearlBankMetric(payout.block.timestamp)
  cumulativeValues.rewardPayoutMarketValue = cumulativeValues.rewardPayoutMarketValue.plus(metric.payoutMatketValue)

  // update metrics
  metric.payoutMatketValue = toDecimal(payout.params.totalUsdPlus, 6)
  metric.cumulativeRewardPayoutMarketValue = cumulativeValues.rewardPayoutMarketValue
  metric.apr = metric.payoutMatketValue.div(stakedMarketValue)
  metric.clamMarketValueWhenPayoutHappens = clamPrice

  metric.clamTotalSupply = toDecimal(clam.totalSupply(), 9)
  metric.stakedCLAMAmount = toDecimal(totalStaked, 9)

  // persist
  cumulativeValues.save()
  metric.save()
}
