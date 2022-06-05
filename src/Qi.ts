import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { Address, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueQiTransfer, loadOrCreateTotalBribeRewardsSingleton } from './utils/TreasuryRevenue'
import { addressEqualsString } from './utils'
import {
  QI_BRIBE_REWARDS,
  TREASURY_ADDRESS,
  UNI_MAI_USDC_QI_INVESTMENT_PAIR,
  UNI_QI_WMATIC_INVESTMENT_PAIR,
} from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getQiMarketValue } from './utils/Price'

export function handleQiTransfer(event: TransferEvent): void {
  if (
    (addressEqualsString(event.params.from, UNI_MAI_USDC_QI_INVESTMENT_PAIR) ||
      addressEqualsString(event.params.from, UNI_QI_WMATIC_INVESTMENT_PAIR)) &&
    addressEqualsString(event.params.to, TREASURY_ADDRESS)
  ) {
    log.debug('QiDaoInvestmentHarvestTransfer {}, from: {}, to: {}', [
      event.transaction.hash.toHexString(),
      event.params.from.toHexString(),
      event.params.to.toHexString(),
    ])
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let entity = new Transfer(transaction.id)
    entity.transaction = transaction.id
    entity.timestamp = transaction.timestamp
    entity.from = event.params.from
    entity.to = event.params.to
    entity.value = event.params.value
    entity.save()

    //Pass entity to TreasuryRevenue
    updateTreasuryRevenueQiTransfer(entity)
  }
  if (addressEqualsString(event.params.from, QI_BRIBE_REWARDS)) {
    log.debug('QiDao Bribe Recieved {} for {} Qi, from: {}, to: {}', [
      event.transaction.hash.toHexString(),
      toDecimal(event.transaction.value, 18).toString(),
      event.params.from.toHexString(),
      event.params.to.toHexString(),
    ])
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let entity = new Transfer(transaction.id)
    entity.transaction = transaction.id
    entity.timestamp = transaction.timestamp
    entity.from = event.params.from
    entity.to = event.params.to
    entity.value = event.params.value
    entity.save()

    //Pass entity to TreasuryRevenue
    updateTreasuryRevenueQiTransfer(entity)

    //Count for QiBribes
    let bribes = loadOrCreateTotalBribeRewardsSingleton()
    let qiMarketValue = getQiMarketValue(toDecimal(event.params.value, 18))
    bribes.qiBribeRewardsMarketValue = bribes.qiBribeRewardsMarketValue.plus(qiMarketValue)
  }
}
