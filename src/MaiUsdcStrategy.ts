import { BigDecimal } from '@graphprotocol/graph-ts'
import { ClaimReward as ClaimRewardEvent } from '../generated/MaiUsdcStrategy/MaiUsdcStrategy'
import { ClaimReward } from '../generated/schema'
import { QiDaoUsdcMaiInvestment } from './Investments/QiDaoUsdcMai'
import { QI_ERC20 } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getQiUsdRate } from './utils/Price'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueClaimQiReward } from './utils/TreasuryRevenue'

export function handleClaimReward(event: ClaimRewardEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let claim = new ClaimReward(`${event.address.toHexString()}_${transaction.id}_${QI_ERC20.toHexString()}`)
  claim.transaction = transaction.id
  claim.timestamp = transaction.timestamp
  claim.amountUsd = toDecimal(event.params.amount, 6) //Claim in USDC (6 decimals)
  claim.amountToken = toDecimal(event.params.amount, 6).div(getQiUsdRate())
  claim.token = QI_ERC20
  claim.save()

  updateTreasuryRevenueClaimQiReward(event.block.number, claim)

  let investment = new QiDaoUsdcMaiInvestment(transaction)
  investment.addRevenue(claim)
}
