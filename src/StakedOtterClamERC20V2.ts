import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  LogRebase as LogRebaseEvent,
  Transfer as TransferEvent,
} from '../generated/StakedOtterClamERC20V2/StakedOtterClamERC20V2'
import { APY, LogRebase, ProtocolMetric, Transfer, TreasuryRevenue } from '../generated/schema'
import { log } from '@graphprotocol/graph-ts'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

const CLAM_DECIMALS = BigDecimal.fromString('1e9')
const ONE = BigDecimal.fromString('1')
//num days to average signal over
const N = 14
//how far into the past we search to find N days of data
const maxLookbackDays = 21

export function handleLogRebase(event: LogRebaseEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new LogRebase(transaction.id)
  entity.epoch = event.params.epoch
  entity.rebase = event.params.rebase
  entity.index = event.params.index
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
  calculateApy(transaction.timestamp)
  updateProtocolMetrics(transaction)
}

export function handleTransfer(event: TransferEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Transfer(transaction.id)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.save()
  updateProtocolMetrics(transaction)
}

/*
(d^p * R) / sCLAM
Where:
d= delta (price difference)
p= power (constant)
R= revenue (clam) 
*/
export function calculateApy(timestamp: BigInt): void {
  let day = timestamp.toI32() - (timestamp.toI32() % 86400)
  let maxLookback = day - 86400 * maxLookbackDays //look up to max days in past

  //only track after block 24088468 == 24-01-2022 UTC
  if (day < 1642978799) {
    return
  }
  //get last valid day of protocol metrics
  let lastMetrics = ProtocolMetric.load(day.toString())
  let dayCounter = day
  while (lastMetrics == null && dayCounter > maxLookback) {
    dayCounter = dayCounter - 86400 //-1day
    lastMetrics = ProtocolMetric.load(dayCounter.toString())
  }
  if (lastMetrics == null) {
    log.warning('Calculating APY @ {}, no past ProtocolMetric could be found', [timestamp.toString()])
    return
  }

  //fetch last N days of revenue and take average
  //does not include today (avoid calculating days before all revenue is collected)
  dayCounter = day - 86400
  let pastRevenues = [] as BigDecimal[]
  while (pastRevenues.length < N && dayCounter > maxLookback) {
    let revenue = TreasuryRevenue.load(dayCounter.toString())
    if (revenue != null) {
      let clamRevenue = revenue.totalRevenueClamAmount
      pastRevenues.push(clamRevenue)
    }
    dayCounter = dayCounter - 86400 //-1day
  }
  if (pastRevenues.length == 0) {
    log.warning('Calculating APY @ {}, no past Treasury Revenues could be found', [timestamp.toString()])
    return
  }

  //in CLAMS per rebase, averaged over N days*3 rebases
  let rebaseRevenue = pastRevenues
    .reduce((x, y) => x.plus(y), BigDecimal.zero())
    .div(
      BigInt.fromI32(pastRevenues.length)
        .times(BigInt.fromString('3'))
        .toBigDecimal(),
    )

  //d = (price / backing) + 1
  let delta_price = lastMetrics.clamPrice.div(lastMetrics.treasuryMarketValue.div(lastMetrics.sClamCirculatingSupply))
  // .plus(ONE)

  //rr = (d^p * R) / sCLAM
  // let rebaseReward = BigDecimal.fromString(Math.pow(Number.parseFloat(delta_price.toString()), 2.25).toString())
  // .times(delta_price)
  // .times(rebaseRevenue)
  let rebaseReward = rebaseRevenue.div(lastMetrics.sClamCirculatingSupply)

  // ((1+rr)^(3*365) - 1) * 100% = APY%
  let apy = BigDecimal.fromString(Math.pow(Number.parseFloat(rebaseReward.plus(ONE).toString()), 365 * 3).toString())
    .minus(ONE)
    .times(BigDecimal.fromString('100'))
    .truncate(3)

  //calculate total amount of CLAM distributed for smart contract
  let distributedClam = rebaseReward
    .times(lastMetrics.sClamCirculatingSupply)
    .times(CLAM_DECIMALS)
    .truncate(0).digits

  log.debug(
    'Calculating APY @ {}, lastMetrics timestamp: {}, num revenue days: {}, avg rebase revenue CLAMs: {}, clam price: {}, price delta: {}, sCLAM supply: {}, rebase reward: {}, APY: {}%, CLAM distributed: {}',
    [
      timestamp.toString(),
      lastMetrics.timestamp.toString(),
      pastRevenues.length.toString(),
      rebaseRevenue.toString(),
      lastMetrics.clamPrice.toString(),
      delta_price.toString(),
      lastMetrics.sClamCirculatingSupply.toString(),
      rebaseReward.toString(),
      apy.toString(),
      distributedClam.toString(),
    ],
  )
  let apyEntity = new APY(timestamp.toString())
  apyEntity.timestamp = timestamp
  apyEntity.apy = apy
  apyEntity.rebaseReward = rebaseReward
  apyEntity.clamDistributed = distributedClam
  apyEntity.clamDistributedDecimal = distributedClam.divDecimal(BigDecimal.fromString('1e9'))
  apyEntity.save()
}
