import {
  ClaimRewardToken as ClaimRewardEvent,
  PayoutReward as PayoutRewardEvent,
} from '../generated/UniV3UsdcMaiStrategy/UniV3UsdcMaiStrategy'
import { ClaimReward, PayoutReward } from '../generated/schema'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimMaiReward, updateTreasuryRevenueClaimUsdcReward } from './utils/TreasuryRevenue'
import { MAI_ERC20, USDC_ERC20 } from './utils/Constants'
import { ERC20 } from '../generated/OtterClamERC20V2/ERC20'
import { UniV3UsdcMaiInvestment } from './Investments/UniV3UsdcMai'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${event.address.toHexString()}_${transaction.id}_${event.params.token.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.usdcAmount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, ERC20.bind(event.params.token).decimals())
  claim.token = event.params.token
  claim.save()

  if (event.params.token == USDC_ERC20) {
    updateTreasuryRevenueClaimUsdcReward(event.block.number, claim)
  }
  if (event.params.token == MAI_ERC20) {
    updateTreasuryRevenueClaimMaiReward(event.block.number, claim)
  }

  // Investments tracking
  let investment = new UniV3UsdcMaiInvestment(transaction)
  investment.addRevenue(claim)
}

export function handlePayoutReward(event: PayoutRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let investment = new UniV3UsdcMaiInvestment(transaction)

  let payout = new PayoutReward(`${investment.strategy}_${transaction.id}`)
  payout.netAssetValue = toDecimal(event.params.nav, 6)
  payout.revenue = toDecimal(event.params.revenue, 6)
  payout.payout = toDecimal(event.params.payout, 6)
  payout.transactionHash = transaction.id
  payout.save()

  investment.calculateNetProfit(payout)
}
