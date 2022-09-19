import { log } from '@graphprotocol/graph-ts'
import { ClaimRewardToken as ClaimRewardTokenEvent } from '../generated/KyberswapMaticStMaticHedgedLpStrategy/KyberswapMaticStMaticHedgedLpStrategy'
import { ERC20 } from '../generated/OtterClamERC20V2/ERC20'
import { ClaimReward } from '../generated/schema'
import { KyberHedgedMaticStMaticInvestment } from './Investments/KyberHedgedMaticStMatic'
import { KNC_ERC20, LDO_ERC20 } from './utils/Constants'
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
  log.warning('Got to KyberInvest ${}', [claim.amountUsd.toString()])
  let investment = new KyberHedgedMaticStMaticInvestment(transaction)
  investment.addRevenue(claim)
}
