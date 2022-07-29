import { BigDecimal } from '@graphprotocol/graph-ts'
import { ClaimReward as ClaimRewardEvent } from '../generated/MaiUsdcStrategy/MaiUsdcStrategy'
import { ClaimReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { getQiUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimQiReward } from './utils/TreasuryRevenue'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(transaction.id)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.amount, 6) //Claim in USDC (6 decimals)
  claim.amountQi = toDecimal(event.params.amount, 6).div(getQiUsdRate())
  claim.save()

  updateTreasuryRevenueClaimQiReward(event.block.number, claim)
}
