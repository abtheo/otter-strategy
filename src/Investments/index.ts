import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { dayFromTimestamp } from '../utils/Dates'
import { ClaimReward, Investment } from '../../generated/schema'

export function loadOrCreateInvestment(strategy: string, timestamp: BigInt): Investment {
  let ts = dayFromTimestamp(timestamp)
  let id = `${strategy}_${ts}`
  let investment = Investment.load(id)
  if (investment == null) {
    investment = new Investment(id)
    investment.timestamp = BigInt.fromString(ts)
    investment.strategy = strategy
    investment.save()
  }
  return investment as Investment
}

export interface InvestmentInterface {
  netAssetValue(): BigDecimal
  addRevenue(claim: ClaimReward): void
}
