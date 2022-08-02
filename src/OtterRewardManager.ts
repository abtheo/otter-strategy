import { Payout } from '../generated/OtterRewardManager/OtterRewardManager'
import { PearlBank } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'
import { getClamUsdRate } from './utils/Price'
import { BigDecimal, log } from '@graphprotocol/graph-ts'

export function handlePayout(payout: Payout): void {
  let metric = loadOrCreatePearlBankMetric(payout.block.timestamp)
  let clamPrice = getClamUsdRate(payout.block.number)
  let pearlBankStakedClam = toDecimal(PearlBank.bind(PEARL_BANK).totalSupply(), 9)

  let stakedUsd = pearlBankStakedClam.times(clamPrice)
  let payoutValue = toDecimal(payout.params.totalUsdPlus, 6)

  // update cumulative values
  let cumulativeValues = loadCumulativeValues()
  let newTotalPaid = cumulativeValues.rewardPayoutMarketValue.plus(payoutValue)
  cumulativeValues.rewardPayoutMarketValue = newTotalPaid
  cumulativeValues.save()
  log.debug('Cumulative value rewards: {}', [cumulativeValues.rewardPayoutMarketValue.toString()])

  // update metrics
  metric.payoutMarketValue = payoutValue
  metric.clamMarketValueWhenPayoutHappens = clamPrice
  metric.totalClamStakedUsdValue = stakedUsd
  metric.cumulativeRewardPayoutMarketValue = newTotalPaid
  metric.rewardRate = payoutValue.div(stakedUsd).times(BigDecimal.fromString('100'))

  // (stakedValue * APR) / 365 = payout
  // (payout*365 / stakedValue) * 100% = APR%
  metric.apr = payoutValue
    .times(BigDecimal.fromString('365'))
    .div(stakedUsd)
    .times(BigDecimal.fromString('100'))

  //( (1+(payout/staked))^365 -1 ) * 100% = APY%
  metric.apy = BigDecimal.fromString(
    (
      (Math.pow(
        Number.parseFloat(
          BigDecimal.fromString('1')
            .plus(payoutValue.div(stakedUsd))
            .toString(),
        ),
        365,
      ) -
        1) *
      100
    ).toString(),
  )
  // persist
  metric.save()
}
