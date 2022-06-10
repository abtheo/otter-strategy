import { Transfer as TransferEvent } from '../generated/wMATIC/wMATIC'
import { log } from '@graphprotocol/graph-ts'
import { Transfer } from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { loadOrCreateTotalBribeRewardsSingleton } from './utils/TreasuryRevenue'
import { addressEqualsString } from './utils'
import { DAO_WALLET, POLYGON_WMATIC_GRANT } from './utils/Constants'
import { toDecimal } from './utils/Decimals'
import { getwMATICMarketValue } from './utils/Price'

export function handlewMATICTransfer(event: TransferEvent): void {
  if (
    addressEqualsString(event.params.src, POLYGON_WMATIC_GRANT) &&
    addressEqualsString(event.params.dst, DAO_WALLET)
  ) {
    log.debug('Polygon Grant Recieved {} for {} wMATIC, from: {}, to: {}', [
      event.transaction.hash.toHexString(),
      toDecimal(event.params.wad, 18).toString(),
      event.params.src.toHexString(),
      event.params.dst.toHexString(),
    ])
    let transaction = loadOrCreateTransaction(event.transaction, event.block)
    let entity = new Transfer(transaction.id)
    entity.transaction = transaction.id
    entity.timestamp = transaction.timestamp
    entity.from = event.params.src
    entity.to = event.params.dst
    entity.value = event.params.wad
    entity.save()

    //TODO: Pass entity to TreasuryRevenue once we have more MATIC income
    // updateTreasuryRevenuewMaticTransfer(entity)

    //Count for Polygon Grants
    let bribes = loadOrCreateTotalBribeRewardsSingleton()
    let wmaticMarketValue = getwMATICMarketValue(toDecimal(event.params.wad, 18))
    bribes.polygonGrantMaticMarketValue = bribes.polygonGrantMaticMarketValue.plus(wmaticMarketValue)
    bribes.save()
  }
}
