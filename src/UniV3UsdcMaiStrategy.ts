import { ClaimRewardToken as ClaimRewardEvent } from '../generated/UniV3UsdcMaiStrategy/UniV3UsdcMaiStrategy'
import { ClaimReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimMaiReward, updateTreasuryRevenueClaimUsdcReward } from './utils/TreasuryRevenue'
import { MAI_ERC20, USDC_ERC20 } from './utils/Constants'
import { ERC20 } from '../generated/OtterClamERC20V2/ERC20'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(transaction.id)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.usdcAmount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, ERC20.bind(event.params.token).decimals())
  claim.token = event.params.token
  claim.save()

  if (event.params.token === USDC_ERC20) {
    updateTreasuryRevenueClaimUsdcReward(event.block.number, claim)
  }
  if (event.params.token === MAI_ERC20) {
    updateTreasuryRevenueClaimMaiReward(event.block.number, claim)
  }
}
