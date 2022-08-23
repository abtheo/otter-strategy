import { BigDecimal } from '@graphprotocol/graph-ts'
import { ClaimReward as ClaimRewardEvent } from '../generated/MaiUsdcStrategy/MaiUsdcStrategy'
import { ClaimRewardLdo } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { getLdoUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimLdoReward } from './utils/TreasuryRevenue'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimRewardLdo(transaction.id)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.amount, 6) //Claim in USDC (6 decimals)
  claim.amountLdo = toDecimal(event.params.amount, 6).div(getLdoUsdRate())
  claim.save()

  updateTreasuryRevenueClaimLdoReward(event.block.number, claim)
}
