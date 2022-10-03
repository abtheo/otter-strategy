import { ClaimRewardToken as ClaimRewardTokenEvent } from '../generated/UniV3MaticUsdcHedgedLpStrategy/IStrategy'
import { ERC20 } from '../generated/OtterClamERC20V2/ERC20'
import { ClaimReward } from '../generated/schema'
import { MATIC_ERC20, USDC_ERC20 } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimMaticReward, updateTreasuryRevenueClaimUsdcReward } from './utils/TreasuryRevenue'
import { UniV3HedgedMaticUsdcInvestment } from './Investments/UniV3HedgedMaticUsdc'

export function handleClaimRewardToken(event: ClaimRewardTokenEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${event.address}_${transaction.id}_${event.params.token.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.usdcAmount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, ERC20.bind(event.params.token).decimals())
  claim.token = event.params.token
  claim.save()

  if (event.params.token == USDC_ERC20) {
    updateTreasuryRevenueClaimUsdcReward(event.block.number, claim)
  }
  if (event.params.token == MATIC_ERC20) {
    updateTreasuryRevenueClaimMaticReward(event.block.number, claim)
  }

  let investment = new UniV3HedgedMaticUsdcInvestment(transaction)
  investment.addRevenue(claim)
}
