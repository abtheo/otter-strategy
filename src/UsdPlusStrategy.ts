import { ClaimReward as ClaimRewardEvent } from '../generated/UsdPlusStrategy/UsdPlusStrategy'
import { ClaimReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimUsdplusReward } from './utils/TreasuryRevenue'
import { USDPLUS_ERC20 } from './utils/Constants'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${event.address.toHexString()}_${transaction.id}_${USDPLUS_ERC20.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.amount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, 6)
  claim.token = USDPLUS_ERC20
  claim.save()

  updateTreasuryRevenueClaimUsdplusReward(event.block.number, claim)
}
