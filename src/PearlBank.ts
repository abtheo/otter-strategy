import { OtterClamERC20V2 } from '../generated/PearlBank/OtterClamERC20V2'
import { PearlBank, Stake, Withdraw } from '../generated/PearlBank/PearlBank'
import { loadOrCreatePearlBankMetric } from './utils/PearlBankMetric'
import { CLAM_ERC20, PEARL_BANK } from './utils/Constants'
import { toDecimal } from './utils/Decimals'

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
    metric.clamTotalSupply = toDecimal(clam.totalSupply(), 9)
    metric.stakedCLAMAmount = toDecimal(pearlBank.totalStaked(), 9)

    metric.save()
}
