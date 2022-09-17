import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from '../utils/Dates'
import { ClaimReward, Investment } from '../../generated/schema'

export function loadOrCreateInvestment(strategy: string, timestamp: BigInt): Investment {
  let ts = dayFromTimestamp(timestamp)

  let investment = Investment.load(`${strategy}_${ts}`)
  if (investment == null) {
    investment = new Investment(ts)
    investment.timestamp = timestamp
    investment.strategy = strategy
    investment.save()
  }
  return investment as Investment
}

export interface InvestmentInterface {
  netAssetValue(block: BigInt): BigDecimal
  addRevenue(claim: ClaimReward): void
}
