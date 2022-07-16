import { BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import { Transfer as TransferEvent } from '../generated/OtterClamERC20V2/OtterClamERC20V2'
import { Transfer, TotalBurnedClam, Transaction } from '../generated/schema'
import { log } from '@graphprotocol/graph-ts'
import { loadOrCreateTransaction } from './utils/Transactions'
import { getClamUsdRate } from './utils/Price'
import { DAO_WALLET, OTTOPIA_STORE, OTTO_PORTAL_MINTING } from './utils/Constants'
import { loadOrCreateTreasuryRevenue } from './utils/TreasuryRevenue'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function handleTransfer(event: TransferEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  updateProtocolMetrics(transaction)
  //BURN events
  if (event.params.to.toHexString() == '0x0000000000000000000000000000000000000000') {
    saveTransfer(event)

    let burnedClam = event.params.value.divDecimal(BigDecimal.fromString('1e9'))
    log.debug('Burned CLAM {} at block {}, txid {}', [
      burnedClam.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
    ])

    //Cumulative total for burned CLAM
    let total = loadOrCreateTotalBurnedClamSingleton()
    total.burnedClam = total.burnedClam.plus(burnedClam)
    total.burnedValueUsd = total.burnedValueUsd.plus(getClamUsdRate().times(burnedClam))
    total.save()
  }
  //Otto Portal minting & Store shell chests
  if (
    (event.params.from == OTTO_PORTAL_MINTING || event.params.from == OTTOPIA_STORE) &&
    event.params.to == DAO_WALLET
  ) {
    saveTransfer(event)

    let recievedClam = event.params.value.divDecimal(BigDecimal.fromString('1e9'))
    let clamMarketValue = recievedClam.times(getClamUsdRate())
    log.debug('Ottopia transfered {} CLAM to DAO at block {}, txid {}', [
      recievedClam.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString(),
    ])

    let revenue = loadOrCreateTreasuryRevenue(event.block.timestamp)

    revenue.ottopiaClamAmount = revenue.ottopiaClamAmount.plus(recievedClam)
    revenue.ottopiaMarketValue = revenue.ottopiaMarketValue.plus(clamMarketValue)

    //add to total revenue
    revenue.totalRevenueClamAmount = revenue.totalRevenueClamAmount.plus(recievedClam)
    revenue.totalRevenueMarketValue = revenue.totalRevenueMarketValue.plus(clamMarketValue)

    revenue.save()
  }
}

export function loadOrCreateTotalBurnedClamSingleton(): TotalBurnedClam {
  let total = TotalBurnedClam.load('1')
  if (total == null) {
    total = new TotalBurnedClam('1')
    total.burnedClam = BigDecimal.zero()
    total.burnedValueUsd = BigDecimal.zero()
  }
  return total
}

function saveTransfer(event: TransferEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Transfer(transaction.id)
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
}
