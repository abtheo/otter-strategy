import { log } from '@graphprotocol/graph-ts'
import {
  PayoutReward as PayoutRewardEvent,
  ClaimRewardToken as ClaimRewardTokenEvent,
} from '../generated/KyberswapMaticStMaticHedgedLpStrategy/KyberswapMaticStMaticHedgedLpStrategy'
import { ERC20 } from '../generated/OtterClamERC20V2/ERC20'
import { ClaimReward } from '../generated/schema'
import { KyberHedgedMaticStMaticInvestment } from './Investments/KyberHedgedMaticStMatic'
import { KNC_ERC20, LDO_ERC20, USDC_ERC20 } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimKncReward, updateTreasuryRevenueClaimLdoReward } from './utils/TreasuryRevenue'

export function handleClaimRewardToken(event: ClaimRewardTokenEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${transaction.id}_${event.params.token.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.usdcAmount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, ERC20.bind(event.params.token).decimals())
  claim.token = event.params.token
  claim.save()

  if (event.params.token == KNC_ERC20) {
    updateTreasuryRevenueClaimKncReward(event.block.number, claim)
  }
  if (event.params.token == LDO_ERC20) {
    updateTreasuryRevenueClaimLdoReward(event.block.number, claim)
  }
}

export function handlePayoutReward(event: PayoutRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${transaction.id}_${event.address.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.revenue, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.revenue, 6)
  claim.token = USDC_ERC20
  claim.save()

  let investment = new KyberHedgedMaticStMaticInvestment(transaction)
  investment.addRevenue(claim)
}
