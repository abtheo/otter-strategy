import { Transfer as TransferEvent } from '../generated/OtterQiLocker/ERC20'
import { log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueQiTransfer } from './utils/TreasuryRevenue'
import {
  OTTER_DEPLOYER,
  QI_BRIBE_REWARDS,
  TREASURY_ADDRESS,
  UNI_MAI_USDC_QI_INVESTMENT_PAIR,
  UNI_QI_WMATIC_INVESTMENT_PAIR,
} from './utils/Constants'
import { toDecimal } from './utils/Decimals'

export function handleQiTransfer(event: TransferEvent): void {
  if (event.params.from == QI_BRIBE_REWARDS && event.params.to == OTTER_DEPLOYER) {
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
    updateTreasuryRevenueQiTransfer(event.block.number, entity)
    return
  }
  if (
    (event.params.from == UNI_MAI_USDC_QI_INVESTMENT_PAIR || event.params.from == UNI_QI_WMATIC_INVESTMENT_PAIR) &&
    event.params.to == TREASURY_ADDRESS
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
    updateTreasuryRevenueQiTransfer(event.block.number, entity)
    return
  }
}
