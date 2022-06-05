import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { Address, log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateTreasuryRevenueQiTransfer } from './utils/TreasuryRevenue'

import { TREASURY_ADDRESS, UNI_MAI_USDC_QI_INVESTMENT_PAIR, UNI_QI_WMATIC_INVESTMENT_PAIR } from './utils/Constants'

export function handleQiDaoInvestmentHarvestTransfer(event: TransferEvent): void {
  if (
    (event.params.from.toHexString() == UNI_MAI_USDC_QI_INVESTMENT_PAIR.toLowerCase() ||
      event.params.from.toHexString() == UNI_QI_WMATIC_INVESTMENT_PAIR.toLowerCase()) &&
    event.params.to.toHexString() == TREASURY_ADDRESS.toLowerCase()
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

    //Pass entity to TreasuryRevenue
    updateTreasuryRevenueQiTransfer(entity)
    entity.save()
  }
}
