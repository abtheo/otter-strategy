import { Payout } from '../generated/OtterRewardManager/OtterRewardManager'
import { OtterClamERC20V2 } from '../generated/OtterRewardManager/OtterClamERC20V2'
import { PearlBank, Stake, Withdraw } from '../generated/OtterRewardManager/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_ERC20, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadCumulativeValues } from './utils/CumulativeValues'

export function handlePayout(payout: Payout): void {
    let clam = OtterClamERC20V2.bind(CLAM_ERC20)
    let pearlBank = PearlBank.bind(PEARL_BANK)

    let cumulativeValues = loadCumulativeValues()
    let metric = loadOrCreatePearlBankMetric(payout.block.timestamp)

    // update cumulative values
    cumulativeValues.rewardPayoutMarketValue = cumulativeValues.rewardPayoutMarketValue.plus(metric.payoutMatketValue)

    // update metrics
    metric.clamTotalSupply = toDecimal(clam.totalSupply(), 6)
    metric.payoutMatketValue = toDecimal(payout.params.totalUsdPlus, 6)
    metric.cumulativeRewardPayoutMarketValue = cumulativeValues.rewardPayoutMarketValue
    metric.stakedCLAMAmount = toDecimal(pearlBank.totalStaked())

    // persist
    cumulativeValues.save()
    metric.save()
}

export function handleStake(stake: Stake): void {
    let clam = OtterClamERC20V2.bind(CLAM_ERC20)
    let pearlBank = PearlBank.bind(PEARL_BANK)

    let metric = loadOrCreatePearlBankMetric(stake.block.timestamp)
    metric.clamTotalSupply = toDecimal(clam.totalSupply(), 6)
    metric.stakedCLAMAmount = toDecimal(pearlBank.totalStaked())

    metric.save()
}

export function handleWithdraw(withdraw: Withdraw): void {
    let clam = OtterClamERC20V2.bind(CLAM_ERC20)
    let pearlBank = PearlBank.bind(PEARL_BANK)

    let metric = loadOrCreatePearlBankMetric(withdraw.block.timestamp)
    metric.clamTotalSupply = toDecimal(clam.totalSupply(), 6)
    metric.stakedCLAMAmount = toDecimal(pearlBank.totalStaked())

    metric.save()
}