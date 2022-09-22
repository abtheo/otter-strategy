import { PayoutReward as PayoutRewardEvent } from '../generated/UniV3UsdcMaiStrategy/UniV3UsdcMaiStrategy'
import { ClaimReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimUsdcReward } from './utils/TreasuryRevenue'
import { USDC_ERC20 } from './utils/Constants'

export function handlePayoutReward(event: PayoutRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(transaction.id)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.revenue, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.revenue, 6)
  claim.token = USDC_ERC20
  claim.save()

  updateTreasuryRevenueClaimUsdcReward(event.block.number, claim)
}
