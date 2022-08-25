import { ClaimReward as ClaimRewardEvent } from '../generated/GainsDaiStrategy/GainsDaiStrategy'
import { ClaimReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimDaiReward } from './utils/TreasuryRevenue'
import { DAI_ERC20 } from './utils/Constants'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(transaction.id)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.amount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, 18)
  claim.token = DAI_ERC20
  claim.save()

  updateTreasuryRevenueClaimDaiReward(event.block.number, claim)
}
