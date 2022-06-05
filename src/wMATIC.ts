import { Transfer as TransferEvent } from '../generated/Qi/Qi'
import { log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTotalBribeRewardsSingleton } from './utils/TreasuryRevenue'
import { addressEqualsString } from './utils'
import { POLYGON_WMATIC_GRANT, TREASURY_ADDRESS } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getwMATICMarketValue } from './utils/Price'

export function handlewMATICTransfer(event: TransferEvent): void {
  if (
    addressEqualsString(event.params.from, POLYGON_WMATIC_GRANT) &&
    addressEqualsString(event.params.to, TREASURY_ADDRESS)
  ) {
    log.debug('Polygon Grant Recieved {} for {} wMATIC, from: {}, to: {}', [
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

    //TODO: Pass entity to TreasuryRevenue once we have more MATIC income
    // updateTreasuryRevenuewMaticTransfer(entity)

    //Count for Polygon Grants
    let bribes = loadOrCreateTotalBribeRewardsSingleton()
    let wmaticMarketValue = getwMATICMarketValue(toDecimal(event.params.value, 18))
    bribes.polygonGrantMaticMarketValue = bribes.qiBribeRewardsMarketValue.plus(wmaticMarketValue)
  }
}
