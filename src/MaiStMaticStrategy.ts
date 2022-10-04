import { ClaimReward as ClaimRewardEvent } from '../generated/MaiUsdcStrategy/MaiUsdcStrategy'
import { ClaimReward } from '../generated/schema'
import { LDO_ERC20 } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getLdoUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimLdoReward } from './utils/TreasuryRevenue'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${event.address.toHexString()}_${transaction.id}_${LDO_ERC20.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.amount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, 6).div(getLdoUsdRate())
  claim.token = LDO_ERC20
  claim.save()

  updateTreasuryRevenueClaimLdoReward(event.block.number, claim)
}
