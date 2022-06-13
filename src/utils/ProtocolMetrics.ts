import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { ClamCirculatingSupply } from '../../generated/OtterTreasury/ClamCirculatingSupply'
import { xTetuQi } from '../../generated/OtterTreasury/xTetuQi'
import { ERC20 } from '../../generated/OtterTreasury/ERC20'
import { OtterClamERC20V2 } from '../../generated/OtterTreasury/OtterClamERC20V2'
import { OtterLake } from '../../generated/OtterTreasury/OtterLake'
import { OtterPearlERC20 } from '../../generated/OtterTreasury/OtterPearlERC20'
import { OtterQiDAOInvestment } from '../../generated/OtterTreasury/OtterQiDAOInvestment'
import { OtterQuickSwapInvestment } from '../../generated/OtterTreasury/OtterQuickSwapInvestment'
import { OtterStaking } from '../../generated/OtterTreasury/OtterStaking'
import { QiFarm } from '../../generated/OtterTreasury/QiFarm'
import { veDyst } from '../../generated/OtterTreasury/veDyst'
import { UniswapV2Pair } from '../../generated/OtterTreasury/UniswapV2Pair'
import { CurveMai3poolContract } from '../../generated/OtterTreasury/CurveMai3poolContract'
import { PenDystRewards } from '../../generated/OtterTreasury/PenDystRewards'
import { PenLockerV2 } from '../../generated/OtterTreasury/PenLockerV2'
import { ProtocolMetric, Transaction } from '../../generated/schema'
import { StakedOtterClamERC20V2 } from '../../generated/StakedOtterClamERC20V2/StakedOtterClamERC20V2'
import {
  CIRCULATING_SUPPLY_CONTRACT,
  CIRCULATING_SUPPLY_CONTRACT_BLOCK,
  CLAM_ERC20,
  DAI_ERC20,
  DQUICK_ERC20,
  FRAX_ERC20,
  MAI_ERC20,
  MATIC_ERC20,
  OCQI_CONTRACT,
  QCQI_START_BLOCK,
  TETU_QI_CONTRACT,
  TETU_QI_START_BLOCK,
  XTETU_QI_CONTRACT,
  XTETU_QI_START_BLOCK,
  OTTER_LAKE_ADDRESS,
  PEARL_CHEST_BLOCK,
  PEARL_ERC20,
  QI_ERC20,
  SCLAM_ERC20,
  STAKING_CONTRACT,
  TREASURY_ADDRESS,
  UNI_CLAM_FRAX_PAIR,
  UNI_CLAM_FRAX_PAIR_BLOCK,
  UNI_CLAM_MAI_PAIR,
  UNI_CLAM_WMATIC_PAIR,
  UNI_CLAM_WMATIC_PAIR_BLOCK,
  UNI_MAI_CLAM_DQUICK_INVESTMENT_PAIR,
  UNI_MAI_CLAM_DQUICK_INVESTMENT_PAIR_BLOCK,
  UNI_MAI_USDC_PAIR,
  UNI_MAI_USDC_PAIR_BLOCK,
  UNI_MAI_USDC_QI_INVESTMENT_PAIR,
  UNI_MAI_USDC_QI_INVESTMENT_PAIR_BLOCK,
  UNI_PEARL_WMATIC_PAIR,
  UNI_PEARL_WMATIC_PAIR_BLOCK,
  UNI_QI_WMATIC_INVESTMENT_PAIR,
  UNI_QI_WMATIC_INVESTMENT_PAIR_BLOCK,
  UNI_QI_WMATIC_PAIR,
  UNI_QI_WMATIC_PAIR_BLOCK,
  CURVE_MAI_3POOL_PAIR,
  CURVE_MAI_3POOL_PAIR_BLOCK,
  CURVE_MAI_3POOL_INVESTMENT_PAIR,
  CURVE_MAI_3POOL_INVESTMENT_PAIR_BLOCK,
  OTTER_QI_LOCKER,
  QI_FARM,
  DYST_ERC20,
  DAO_WALLET,
  DYSTOPIA_PAIR_WMATIC_DYST,
  DYSTOPIA_PAIR_MAI_CLAM,
  DYSTOPIA_PAIR_MAI_CLAM_START_BLOCK,
  DYSTOPIA_veDYST,
  DYSTOPIA_veDYST_ERC721_ID,
  DYSTOPIA_TRACKED_PAIRS,
  DYSTOPIA_PAIR_USDPLUS_CLAM,
  DYSTOPIA_PAIR_MAI_USDC,
  DYSTOPIA_PAIR_FRAX_USDC,
  DYSTOPIA_PAIR_WMATIC_PEN,
  PEN_ERC20,
  PENDYST_ERC20,
  PEN_DYST_REWARDS,
  DAO_WALLET_PENROSE_USER_PROXY,
  PEN_DYST_REWARD_PROXY,
  VLPEN_LOCKER,
} from './Constants'
import { dayFromTimestamp } from './Dates'
import { toDecimal } from './Decimals'
import {
  getClamUsdRate,
  getPairUSD,
  getPairWMATIC,
  getwMaticUsdRate,
  getDystUsdRate,
  getDystPairUSD,
  findPrice,
  getQiUsdRate,
  getPenDystUsdRate,
  getPenUsdRate,
} from './Price'
import { loadOrCreateTotalBurnedClamSingleton } from '../OtterClamERC20V2'
import { DystPair } from '../../generated/OtterTreasury/DystPair'
import { loadOrCreateDystopiaGaugeBalance } from '../DystPair'

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric {
  let dayTimestamp = dayFromTimestamp(timestamp)

  let protocolMetric = ProtocolMetric.load(dayTimestamp)
  if (protocolMetric == null) {
    protocolMetric = new ProtocolMetric(dayTimestamp)
    protocolMetric.timestamp = timestamp
    protocolMetric.clamCirculatingSupply = BigDecimal.zero()
    protocolMetric.sClamCirculatingSupply = BigDecimal.zero()
    protocolMetric.totalSupply = BigDecimal.zero()
    protocolMetric.clamPrice = BigDecimal.zero()
    protocolMetric.marketCap = BigDecimal.zero()
    protocolMetric.totalValueLocked = BigDecimal.zero()
    protocolMetric.treasuryRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryMaiUsdcRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryMaiUsdcQiInvestmentRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryMarketValue = BigDecimal.zero()
    protocolMetric.nextEpochRebase = BigDecimal.zero()
    protocolMetric.nextDistributedClam = BigDecimal.zero()
    protocolMetric.currentAPY = BigDecimal.zero()
    protocolMetric.safeHandAPY = BigDecimal.zero()
    protocolMetric.furryHandAPY = BigDecimal.zero()
    protocolMetric.stoneHandAPY = BigDecimal.zero()
    protocolMetric.diamondHandAPY = BigDecimal.zero()
    protocolMetric.treasuryMaiRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryMaiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryFraxRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryFraxMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDaiRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryWmaticRiskFreeValue = BigDecimal.zero()
    protocolMetric.treasuryWmaticMarketValue = BigDecimal.zero()
    protocolMetric.treasuryQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryTetuQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDquickMarketValue = BigDecimal.zero()
    protocolMetric.treasuryQiWmaticMarketValue = BigDecimal.zero()
    protocolMetric.treasuryQiWmaticQiInvestmentMarketValue = BigDecimal.zero()
    protocolMetric.treasuryOtterClamQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryClamMaiPOL = BigDecimal.zero()
    protocolMetric.treasuryClamFraxPOL = BigDecimal.zero()
    protocolMetric.treasuryClamWmaticPOL = BigDecimal.zero()
    protocolMetric.totalBurnedClam = BigDecimal.zero()
    protocolMetric.totalBurnedClamMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairUSDPLUSClamMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairMaiClamMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairMaiUsdcMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairFraxUsdcMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairwMaticDystMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystMarketValue = BigDecimal.zero()
    protocolMetric.treasuryVeDystMarketValue = BigDecimal.zero()
    protocolMetric.treasuryPenDystMarketValue = BigDecimal.zero()

    protocolMetric.save()
  }
  return protocolMetric as ProtocolMetric
}

function getTotalSupply(): BigDecimal {
  let clam_contract = OtterClamERC20V2.bind(Address.fromString(CLAM_ERC20))
  let total_supply = toDecimal(clam_contract.totalSupply(), 9)
  log.debug('Total Supply {}', [total_supply.toString()])
  return total_supply
}

function getCirculatingSupply(transaction: Transaction, total_supply: BigDecimal): BigDecimal {
  let circ_supply = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))) {
    let circulatingSupply_contract = ClamCirculatingSupply.bind(Address.fromString(CIRCULATING_SUPPLY_CONTRACT))
    circ_supply = toDecimal(circulatingSupply_contract.CLAMCirculatingSupply(), 9)
  } else {
    circ_supply = total_supply
  }
  log.debug('Circulating Supply {}', [total_supply.toString()])
  return circ_supply
}

function getSClamSupply(transaction: Transaction): BigDecimal {
  let sclam_supply = BigDecimal.zero()

  let sclam_contract = StakedOtterClamERC20V2.bind(Address.fromString(SCLAM_ERC20))
  sclam_supply = toDecimal(sclam_contract.circulatingSupply(), 9)

  log.debug('sCLAM Supply {}', [sclam_supply.toString()])
  return sclam_supply
}

function getMai3poolValue(): BigDecimal {
  let mai3pool = CurveMai3poolContract.bind(Address.fromString(CURVE_MAI_3POOL_PAIR))
  let balance = toDecimal(mai3pool.balanceOf(Address.fromString(TREASURY_ADDRESS)), 18)
  let price = toDecimal(mai3pool.get_virtual_price(), 18)
  let value = balance.times(price)
  log.debug('MAI3Pool balance {}, price {}, value {}', [balance.toString(), price.toString(), value.toString()])
  return value
}

function getMai3poolInvestmentValue(): BigDecimal {
  let mai3pool = CurveMai3poolContract.bind(Address.fromString(CURVE_MAI_3POOL_PAIR))
  let investment = ERC20.bind(Address.fromString(CURVE_MAI_3POOL_INVESTMENT_PAIR))
  let balance = toDecimal(investment.balanceOf(Address.fromString(TREASURY_ADDRESS)), 18)
  let price = toDecimal(mai3pool.get_virtual_price(), 18)
  let value = balance.times(price)
  log.debug('MAI3Pool investment balance {}, price {}, value {}', [
    balance.toString(),
    price.toString(),
    value.toString(),
  ])
  return value
}

function getMaiUsdcValue(): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(UNI_MAI_USDC_PAIR))

  let reserves = pair.getReserves()
  let usdc = toDecimal(reserves.value0, 6)
  let mai = toDecimal(reserves.value1, 18)
  log.debug('pair mai {}, usdc {}', [mai.toString(), usdc.toString()])

  let balance = pair.balanceOf(Address.fromString(TREASURY_ADDRESS)).toBigDecimal()
  let total = pair.totalSupply().toBigDecimal()
  log.debug('pair MAI/USDC LP balance {}, total {}', [balance.toString(), total.toString()])

  let value = usdc
    .plus(mai)
    .times(balance)
    .div(total)
  log.debug('pair MAI/USDC value {}', [value.toString()])
  return value
}

function getMaiUsdcInvestmentValue(): BigDecimal {
  let pair = OtterQiDAOInvestment.bind(Address.fromString(UNI_MAI_USDC_QI_INVESTMENT_PAIR))
  let reserves = pair.getReserves()
  let usdc = toDecimal(reserves.value0, 6)
  let mai = toDecimal(reserves.value1, 18)
  log.debug('investment mai {}, usdc {}', [mai.toString(), usdc.toString()])

  let balance = pair.balanceOf(Address.fromString(TREASURY_ADDRESS)).toBigDecimal()
  let total = pair.totalSupply().toBigDecimal()
  log.debug('investment MAI/USDC LP balance {}, total {}', [balance.toString(), total.toString()])

  let value = usdc
    .plus(mai)
    .times(balance)
    .div(total)
  log.debug('investment MAI/USDC value {}', [value.toString()])
  return value
}

function getQiWmaticMarketValue(): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(UNI_QI_WMATIC_PAIR))
  let reserves = pair.getReserves()
  let wmatic = toDecimal(reserves.value0, 18)
  let qi = toDecimal(reserves.value1, 18)
  log.debug('pair qi {}, wmatic {}', [qi.toString(), wmatic.toString()])

  let balance = pair.balanceOf(Address.fromString(TREASURY_ADDRESS)).toBigDecimal()

  let total = pair.totalSupply().toBigDecimal()
  log.debug('pair WMATIC/Qi LP balance {}, total {}', [balance.toString(), total.toString()])

  let wmaticPerQi = wmatic.div(qi)

  let value = wmatic
    .plus(wmaticPerQi.times(qi))
    .times(getwMaticUsdRate())
    .times(balance)
    .div(total)
  log.debug('pair WMATIC/Qi value {}', [value.toString()])
  return value
}

function getQiWmaticInvestmentMarketValue(): BigDecimal {
  let pair = OtterQiDAOInvestment.bind(Address.fromString(UNI_QI_WMATIC_INVESTMENT_PAIR))
  let reserves = pair.getReserves()
  let wmatic = toDecimal(reserves.value0, 18)
  let qi = toDecimal(reserves.value1, 18)
  log.debug('investment wmatic {}, qi {}', [qi.toString(), wmatic.toString()])

  let balance = pair.balanceOf(Address.fromString(TREASURY_ADDRESS)).toBigDecimal()
  let farm = QiFarm.bind(Address.fromString(QI_FARM))
  let deposited = farm.deposited(BigInt.fromU64(4), Address.fromString(OTTER_QI_LOCKER)).toBigDecimal()

  let total = pair.totalSupply().toBigDecimal()
  log.debug('investment WMATIC/Qi LP balance {}, total {}', [balance.toString(), total.toString()])

  let wmaticPerQi = wmatic.div(qi)

  let value = wmatic
    .plus(wmaticPerQi.times(qi))
    .times(getwMaticUsdRate())
    .times(balance.plus(deposited))
    .div(total)
  log.debug('investment WMATIC/Qi value {}', [value.toString()])
  return value
}

function getPearlWmaticMarketValue(): BigDecimal {
  let pair = UniswapV2Pair.bind(Address.fromString(UNI_PEARL_WMATIC_PAIR))
  let reserves = pair.getReserves()
  let wmatic = toDecimal(reserves.value0, 18)
  let pearl = toDecimal(reserves.value1, 18)
  log.debug('pair pearl {}, wmatic {}', [pearl.toString(), wmatic.toString()])

  let balance = pair.balanceOf(Address.fromString(TREASURY_ADDRESS)).toBigDecimal()

  let total = pair.totalSupply().toBigDecimal()
  log.debug('pair WMATIC/PEARL LP balance {}, total {}', [balance.toString(), total.toString()])

  let wmaticPerPearl = wmatic.div(pearl)

  let value = wmatic
    .plus(wmaticPerPearl.times(pearl))
    .times(getwMaticUsdRate())
    .times(balance)
    .div(total)
  log.debug('pair WMATIC/PEARL value {}', [value.toString()])
  return value
}

export function getTreasuryTokenValue(address: Address): BigDecimal {
  let usdPerToken = findPrice(address)
  let token = ERC20.bind(address)
  let tokenBalance = toDecimal(token.balanceOf(Address.fromString(TREASURY_ADDRESS)), token.decimals()).plus(
    toDecimal(token.balanceOf(Address.fromString(DAO_WALLET)), token.decimals()),
  )
  let marketValue = tokenBalance.times(usdPerToken)
  return marketValue
}

/* Mutates the provided ProtocolMetric by setting the relevant properties*/
function setTreasuryAssetMarketValues(transaction: Transaction, protocolMetric: ProtocolMetric): ProtocolMetric {
  let maiERC20 = ERC20.bind(Address.fromString(MAI_ERC20))
  let fraxERC20 = ERC20.bind(Address.fromString(FRAX_ERC20))
  let daiERC20 = ERC20.bind(Address.fromString(DAI_ERC20))
  let maticERC20 = ERC20.bind(Address.fromString(MATIC_ERC20))
  let qiERC20 = ERC20.bind(Address.fromString(QI_ERC20))
  let tetuQiERC20 = ERC20.bind(Address.fromString(TETU_QI_CONTRACT))

  let xTetuQiERC20 = xTetuQi.bind(Address.fromString(XTETU_QI_CONTRACT))

  let clamMaiPair = UniswapV2Pair.bind(Address.fromString(UNI_CLAM_MAI_PAIR))
  let clamFraxPair = UniswapV2Pair.bind(Address.fromString(UNI_CLAM_FRAX_PAIR))
  let clamWmaticPair = UniswapV2Pair.bind(Address.fromString(UNI_CLAM_WMATIC_PAIR))

  let treasury_address = Address.fromString(TREASURY_ADDRESS)
  let maiBalance = maiERC20.balanceOf(treasury_address)
  let fraxBalance = fraxERC20.balanceOf(treasury_address)
  let daiBalance = daiERC20.balanceOf(treasury_address)

  let wmaticBalance = maticERC20.balanceOf(treasury_address)
  let wmatic_value = toDecimal(wmaticBalance, 18).times(getwMaticUsdRate())

  //CLAM-MAI & Investment to Quickswap
  let clamMaiBalance = clamMaiPair.balanceOf(treasury_address)
  let dQuickMarketValue = BigDecimal.zero()

  if (transaction.blockNumber.gt(BigInt.fromString(UNI_MAI_CLAM_DQUICK_INVESTMENT_PAIR_BLOCK))) {
    let pair = OtterQuickSwapInvestment.bind(Address.fromString(UNI_MAI_CLAM_DQUICK_INVESTMENT_PAIR))
    let clamMaiInvestmentBalance = pair.balanceOf(treasury_address)
    clamMaiBalance = clamMaiBalance.plus(clamMaiInvestmentBalance)
    dQuickMarketValue = getTreasuryTokenValue(Address.fromString(DQUICK_ERC20))
  }

  let clamMaiTotalLP = toDecimal(clamMaiPair.totalSupply(), 18)
  let clamMaiPOL = toDecimal(clamMaiBalance, 18)
    .div(clamMaiTotalLP)
    .times(BigDecimal.fromString('100'))
  let clamMai_value = getPairUSD(clamMaiBalance, UNI_CLAM_MAI_PAIR)

  //CLAM-FRAX
  let clamFraxBalance = BigInt.fromI32(0)
  let clamFrax_value = BigDecimal.zero()
  let clamFraxTotalLP = BigDecimal.zero()
  let clamFraxPOL = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_CLAM_FRAX_PAIR_BLOCK))) {
    clamFraxBalance = clamFraxPair.balanceOf(treasury_address)
    clamFrax_value = getPairUSD(clamFraxBalance, UNI_CLAM_FRAX_PAIR)
    clamFraxTotalLP = toDecimal(clamFraxPair.totalSupply(), 18)
    if (clamFraxTotalLP.gt(BigDecimal.zero()) && clamFraxBalance.gt(BigInt.fromI32(0))) {
      clamFraxPOL = toDecimal(clamFraxBalance, 18)
        .div(clamFraxTotalLP)
        .times(BigDecimal.fromString('100'))
    }
  }

  let clamWmatic = BigInt.fromI32(0)
  let clamWmatic_value = BigDecimal.zero()
  let clamWmaticTotalLP = BigDecimal.zero()
  let clamWmaticPOL = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_CLAM_WMATIC_PAIR_BLOCK))) {
    clamWmatic = clamWmaticPair.balanceOf(treasury_address)
    log.debug('clamMaticBalance {}', [clamWmatic.toString()])

    clamWmatic_value = getPairWMATIC(clamWmatic, UNI_CLAM_WMATIC_PAIR)
    log.debug('clamWmatic_value {}', [clamWmatic_value.toString()])

    clamWmaticTotalLP = toDecimal(clamWmaticPair.totalSupply(), 18)
    if (clamWmaticTotalLP.gt(BigDecimal.zero()) && clamWmatic.gt(BigInt.fromI32(0))) {
      clamWmaticPOL = toDecimal(clamWmatic, 18)
        .div(clamWmaticTotalLP)
        .times(BigDecimal.fromString('100'))
    }
  }

  let mai3poolValueDecimal = BigDecimal.zero()
  if (transaction.blockNumber.ge(BigInt.fromString(CURVE_MAI_3POOL_PAIR_BLOCK))) {
    mai3poolValueDecimal = getMai3poolValue()
  }

  let mai3poolInvestmentValueDecimal = BigDecimal.zero()
  if (transaction.blockNumber.ge(BigInt.fromString(CURVE_MAI_3POOL_INVESTMENT_PAIR_BLOCK))) {
    mai3poolInvestmentValueDecimal = getMai3poolInvestmentValue()
  }

  let maiUsdcValueDecimal = BigDecimal.zero()
  if (transaction.blockNumber.ge(BigInt.fromString(UNI_MAI_USDC_PAIR_BLOCK))) {
    maiUsdcValueDecimal = getMaiUsdcValue()
  }

  let qiMarketValue = BigDecimal.zero()
  let maiUsdcQiInvestmentValueDecimal = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_MAI_USDC_QI_INVESTMENT_PAIR_BLOCK))) {
    maiUsdcQiInvestmentValueDecimal = getMaiUsdcInvestmentValue()
    qiMarketValue = getQiUsdRate().times(
      toDecimal(qiERC20.balanceOf(Address.fromString(TREASURY_ADDRESS)), qiERC20.decimals()),
    )
  }

  let tetuQiMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(TETU_QI_START_BLOCK))) {
    tetuQiMarketValue = tetuQiMarketValue.plus(
      getQiUsdRate().times(
        toDecimal(tetuQiERC20.balanceOf(Address.fromString(TREASURY_ADDRESS)), tetuQiERC20.decimals()),
      ),
    )
  }
  if (transaction.blockNumber.gt(BigInt.fromString(XTETU_QI_START_BLOCK))) {
    tetuQiMarketValue = tetuQiMarketValue.plus(
      getQiUsdRate().times(
        toDecimal(
          xTetuQiERC20.underlyingBalanceWithInvestmentForHolder(Address.fromString(TREASURY_ADDRESS)),
          xTetuQiERC20.decimals(),
        ),
      ),
    )
  }

  let qiWmaticMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_QI_WMATIC_PAIR_BLOCK))) {
    qiWmaticMarketValue = getQiWmaticMarketValue()
  }
  let qiWmaticQiInvestmentMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_QI_WMATIC_INVESTMENT_PAIR_BLOCK))) {
    qiWmaticQiInvestmentMarketValue = getQiWmaticInvestmentMarketValue()
  }

  let pearlWmaticMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_PEARL_WMATIC_PAIR_BLOCK))) {
    pearlWmaticMarketValue = getPearlWmaticMarketValue()
  }

  let ocQiMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(QCQI_START_BLOCK))) {
    ocQiMarketValue = getTreasuryTokenValue(Address.fromString(OCQI_CONTRACT))
  }

  //DYSTOPIA & PENROSE
  let wMaticDystValue = BigDecimal.zero()
  let clamMaiDystValue = BigDecimal.zero()
  let clamUsdplusDystValue = BigDecimal.zero()
  let usdcMaiDystValue = BigDecimal.zero()
  let usdcFraxDystValue = BigDecimal.zero()
  let wMaticPenValue = BigDecimal.zero()
  let dystMarketValue = BigDecimal.zero()
  let veDystMarketValue = BigDecimal.zero()
  let penMarketValue = BigDecimal.zero()
  let vlPenMarketValue = BigDecimal.zero()
  let penDystMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString('28773233'))) {
    dystMarketValue = getTreasuryTokenValue(Address.fromString(DYST_ERC20))

    for (let i = 0; i < DYSTOPIA_TRACKED_PAIRS.length; i++) {
      let pair_address = DYSTOPIA_TRACKED_PAIRS[i]
      //first check if the DAO wallet holds LP tokens directly
      let dystopiaPair = DystPair.bind(Address.fromString(pair_address))
      let pairDystBalance = dystopiaPair.try_balanceOf(Address.fromString(DAO_WALLET))
      if (pairDystBalance.reverted) continue
      let pairValue = getDystPairUSD(pairDystBalance.value, pair_address)
      //then add the Gauge staked LP balance
      let dystGaugeLp = loadOrCreateDystopiaGaugeBalance(Address.fromString(pair_address))
      pairValue = pairValue.plus(getDystPairUSD(dystGaugeLp.balance, pair_address))

      //finally, associate with relevant property
      if (pair_address == DYSTOPIA_PAIR_WMATIC_DYST) wMaticDystValue = pairValue
      if (pair_address == DYSTOPIA_PAIR_MAI_CLAM) clamMaiDystValue = pairValue
      if (pair_address == DYSTOPIA_PAIR_USDPLUS_CLAM) clamUsdplusDystValue = pairValue
      if (pair_address == DYSTOPIA_PAIR_MAI_USDC) usdcMaiDystValue = pairValue
      if (pair_address == DYSTOPIA_PAIR_FRAX_USDC) usdcFraxDystValue = pairValue
      if (pair_address == DYSTOPIA_PAIR_WMATIC_PEN) wMaticPenValue = pairValue
    }

    //plus the locked veDyst inside NFT
    let veDystContract = veDyst.bind(Address.fromString(DYSTOPIA_veDYST))
    veDystMarketValue = toDecimal(veDystContract.balanceOfNFT(BigInt.fromString(DYSTOPIA_veDYST_ERC721_ID)), 18).times(
      getDystUsdRate(),
    )
  }
  if (transaction.blockNumber.gt(BigInt.fromString('29401160'))) {
    penMarketValue = getTreasuryTokenValue(Address.fromString(PEN_ERC20))
    let penDyst = ERC20.bind(Address.fromString(PENDYST_ERC20))
    let penDystStaking = PenDystRewards.bind(Address.fromString(PEN_DYST_REWARD_PROXY))

    let penDystAmount = toDecimal(
      penDyst
        .balanceOf(Address.fromString(DAO_WALLET))
        .plus(penDyst.balanceOf(Address.fromString(DAO_WALLET_PENROSE_USER_PROXY)))
        .plus(penDystStaking.balanceOf(Address.fromString(DAO_WALLET_PENROSE_USER_PROXY))),
      18,
    )

    penDystMarketValue = penDystAmount.times(getPenDystUsdRate())

    let vlPenContract = PenLockerV2.bind(Address.fromString(VLPEN_LOCKER))
    let vlPenAmt = toDecimal(vlPenContract.balanceOf(Address.fromString(DAO_WALLET_PENROSE_USER_PROXY)), 18)
    vlPenMarketValue = vlPenAmt.times(getPenUsdRate())
    log.debug('Pen MV {};   PenDyst Amount {} MV {};  vlPEN Amt {} MV {}', [
      penMarketValue.toString(),
      penDystAmount.toString(),
      penDystMarketValue.toString(),
      vlPenAmt.toString(),
      vlPenMarketValue.toString(),
    ])
  }
  let stableValue = maiBalance.plus(fraxBalance).plus(daiBalance)
  let stableValueDecimal = toDecimal(stableValue, 18)
    .plus(maiUsdcValueDecimal)
    .plus(maiUsdcQiInvestmentValueDecimal)
    .plus(mai3poolValueDecimal)
    .plus(mai3poolInvestmentValueDecimal)

  let lpValue = clamMai_value
    .plus(clamFrax_value)
    .plus(clamWmatic_value)
    .plus(qiWmaticMarketValue)
    .plus(qiWmaticQiInvestmentMarketValue)
    .plus(pearlWmaticMarketValue)
    //dystopia
    .plus(wMaticDystValue)
    .plus(clamMaiDystValue)
    .plus(clamUsdplusDystValue)
    .plus(usdcMaiDystValue)
    .plus(usdcFraxDystValue)
    .plus(wMaticPenValue)

  let mv = stableValueDecimal
    .plus(lpValue)
    .plus(wmatic_value)
    .plus(qiMarketValue)
    .plus(dQuickMarketValue)
    .plus(ocQiMarketValue)
    .plus(tetuQiMarketValue)
    .plus(dystMarketValue)
    .plus(veDystMarketValue)
    .plus(penMarketValue)
    .plus(vlPenMarketValue)
    .plus(penDystMarketValue)

  //Attach results and return
  protocolMetric.treasuryMarketValue = mv
  protocolMetric.treasuryMaiUsdcRiskFreeValue = maiUsdcValueDecimal
  protocolMetric.treasuryMaiUsdcQiInvestmentRiskFreeValue = maiUsdcQiInvestmentValueDecimal
  protocolMetric.treasuryCurveMai3PoolValue = mai3poolValueDecimal
  protocolMetric.treasuryCurveMai3PoolInvestmentValue = mai3poolInvestmentValueDecimal
  protocolMetric.treasuryMaiMarketValue = clamMai_value.plus(toDecimal(maiBalance, 18))
  protocolMetric.treasuryFraxMarketValue = clamFrax_value.plus(toDecimal(fraxBalance, 18))
  protocolMetric.treasuryDaiRiskFreeValue = toDecimal(daiBalance, 18)
  protocolMetric.treasuryWmaticMarketValue = clamWmatic_value.plus(wmatic_value).plus(pearlWmaticMarketValue)
  protocolMetric.treasuryQiMarketValue = qiMarketValue
  protocolMetric.treasuryDquickMarketValue = dQuickMarketValue
  protocolMetric.treasuryQiWmaticMarketValue = qiWmaticMarketValue
  protocolMetric.treasuryQiWmaticQiInvestmentMarketValue = qiWmaticQiInvestmentMarketValue
  protocolMetric.treasuryOtterClamQiMarketValue = ocQiMarketValue
  protocolMetric.treasuryTetuQiMarketValue = tetuQiMarketValue
  protocolMetric.treasuryClamMaiPOL = clamMaiPOL
  protocolMetric.treasuryClamFraxPOL = clamFraxPOL
  protocolMetric.treasuryClamWmaticPOL = clamWmaticPOL
  protocolMetric.treasuryDystopiaPairwMaticDystMarketValue = wMaticDystValue
  protocolMetric.treasuryDystopiaPairMaiClamMarketValue = clamMaiDystValue
  protocolMetric.treasuryDystopiaPairUSDPLUSClamMarketValue = clamUsdplusDystValue
  protocolMetric.treasuryDystopiaPairMaiUsdcMarketValue = usdcMaiDystValue
  protocolMetric.treasuryDystopiaPairFraxUsdcMarketValue = usdcFraxDystValue
  protocolMetric.treasuryDystopiaPairwMaticPenMarketValue = wMaticPenValue
  protocolMetric.treasuryDystMarketValue = dystMarketValue
  protocolMetric.treasuryVeDystMarketValue = veDystMarketValue
  protocolMetric.treasuryPenMarketValue = penMarketValue
  protocolMetric.treasuryVlPenMarketValue = vlPenMarketValue
  protocolMetric.treasuryPenDystMarketValue = penDystMarketValue

  return protocolMetric
}

function getNextCLAMRebase(): BigDecimal {
  let staking_contract = OtterStaking.bind(Address.fromString(STAKING_CONTRACT))
  let distribution_v1 = toDecimal(staking_contract.epoch().value3, 9)
  log.debug('next_distribution v2 {}', [distribution_v1.toString()])
  let next_distribution = distribution_v1
  log.debug('next_distribution total {}', [next_distribution.toString()])
  return next_distribution
}

function getAPY_Rebase(sCLAM: BigDecimal, distributedCLAM: BigDecimal): BigDecimal[] {
  let nextEpochRebase = distributedCLAM.div(sCLAM).times(BigDecimal.fromString('100'))

  let nextEpochRebase_number = Number.parseFloat(nextEpochRebase.toString())
  let currentAPY = (Math.pow(nextEpochRebase_number / 100 + 1, 1095) - 1) * 100

  let currentAPYdecimal = BigDecimal.fromString(currentAPY.toString())

  log.debug('next_rebase {}', [nextEpochRebase.toString()])
  log.debug('current_apy total {}', [currentAPYdecimal.toString()])

  return [currentAPYdecimal, nextEpochRebase]
}

function getAPY_PearlChest(nextEpochRebase: BigDecimal): BigDecimal[] {
  let lake = OtterLake.bind(Address.fromString(OTTER_LAKE_ADDRESS))
  let pearl = OtterPearlERC20.bind(Address.fromString(PEARL_ERC20))
  let termsCount = lake.termsCount().toI32()
  log.debug('pearl chest termsCount {}', [termsCount.toString()])
  let rebaseRate = Number.parseFloat(nextEpochRebase.toString()) / 100
  log.debug('pearl chest rebaseRate {}', [rebaseRate.toString()])
  let epoch = lake.epochs(lake.epoch())
  let totalNextReward = Number.parseFloat(
    toDecimal(epoch.value4, 18).toString(), // reward
  )
  log.debug('pearl chest totalNextReward {}', [totalNextReward.toString()])
  let totalBoostPoint = 0.0

  let safeBoostPoint = 0.0
  let safePearlBalance = 0.0
  let furryBoostPoint = 0.0
  let furryPearlBalance = 0.0
  let stoneBoostPoint = 0.0
  let stonePearlBalance = 0.0
  let diamondBoostPoint = 0.0
  let diamondPearlBalance = 0.0

  for (let i = 0; i < termsCount; i++) {
    let termAddress = lake.termAddresses(BigInt.fromI32(i))
    let term = lake.terms(termAddress)
    let pearlBalance = Number.parseFloat(toDecimal(pearl.balanceOf(term.value0), 18).toString()) // note
    let boostPoint = (pearlBalance * term.value3) / 100 // multiplier
    log.debug('pearl chest terms i = {}, boostPoint = {}, lockPeriod = {}, pearlBalance = {}', [
      i.toString(),
      boostPoint.toString(),
      term.value2.toString(),
      pearlBalance.toString(),
    ])

    totalBoostPoint += boostPoint
    if (term.value2.equals(BigInt.fromI32(42))) {
      // lock days = 14 -> safe hand
      safeBoostPoint += boostPoint
      safePearlBalance += pearlBalance
    }
    if (term.value2.equals(BigInt.fromI32(84))) {
      // lock days = 28 -> furry hand
      furryBoostPoint += boostPoint
      furryPearlBalance += pearlBalance
    }
    if (term.value2.equals(BigInt.fromI32(270))) {
      // lock days = 90 -> stone hand
      stoneBoostPoint += boostPoint
      stonePearlBalance += pearlBalance
    }
    if (term.value2.equals(BigInt.fromI32(540))) {
      // lock days = 189 -> diamond hand
      diamondBoostPoint += boostPoint
      diamondPearlBalance += pearlBalance
    }
  }
  log.debug('pearl chest totalBoostPoint = {}', [totalBoostPoint.toString()])
  log.debug('pearl chest safeBoostPoint = {}, safePearlBalance = {}', [
    safeBoostPoint.toString(),
    safePearlBalance.toString(),
  ])
  let safeHandAPY =
    (Math.pow(1 + (safeBoostPoint / totalBoostPoint) * (totalNextReward / safePearlBalance) + rebaseRate, 1095) - 1) *
    100
  log.debug('pearl chest safeHandAPY = {}', [safeHandAPY.toString()])
  log.debug('pearl chest furryBoostPoint = {}, furryPearlBalance = {}', [
    furryBoostPoint.toString(),
    furryPearlBalance.toString(),
  ])
  let furryHandAPY =
    (Math.pow(1 + (furryBoostPoint / totalBoostPoint) * (totalNextReward / furryPearlBalance) + rebaseRate, 1095) - 1) *
    100
  log.debug('pearl chest furryHandAPY = {}', [furryHandAPY.toString()])
  log.debug('pearl chest stoneBoostPoint = {}, stonePearlBalance = {}', [
    stoneBoostPoint.toString(),
    stonePearlBalance.toString(),
  ])
  let stoneHandAPY =
    (Math.pow(1 + (stoneBoostPoint / totalBoostPoint) * (totalNextReward / stonePearlBalance) + rebaseRate, 1095) - 1) *
    100
  log.debug('pearl chest stoneHandAPY = {}', [stoneHandAPY.toString()])
  log.debug('pearl chest diamonBoostPoint = {}, diamondPearlBalance = {}', [
    diamondBoostPoint.toString(),
    diamondPearlBalance.toString(),
  ])
  let diamondHandAPY =
    (Math.pow(1 + (diamondBoostPoint / totalBoostPoint) * (totalNextReward / diamondPearlBalance) + rebaseRate, 1095) -
      1) *
    100
  log.debug('pearl chest diamondHandAPY = {}', [stoneHandAPY.toString()])
  return [
    BigDecimal.fromString(safeHandAPY.toString()),
    BigDecimal.fromString(furryHandAPY.toString()),
    BigDecimal.fromString(stoneHandAPY.toString()),
    BigDecimal.fromString(diamondHandAPY.toString()),
  ]
}

export function updateProtocolMetrics(transaction: Transaction): void {
  let pm = loadOrCreateProtocolMetric(transaction.timestamp)

  //Treasury MV
  pm = setTreasuryAssetMarketValues(transaction, pm)

  //Total Supply
  pm.totalSupply = getTotalSupply()

  //Circ Supply
  pm.clamCirculatingSupply = getCirculatingSupply(transaction, pm.totalSupply)

  //sClam Supply
  pm.sClamCirculatingSupply = getSClamSupply(transaction)

  //CLAM Price
  pm.clamPrice = getClamUsdRate()

  //CLAM Market Cap
  pm.marketCap = pm.clamCirculatingSupply.times(pm.clamPrice)

  //Total Value Locked
  pm.totalValueLocked = pm.sClamCirculatingSupply.times(pm.clamPrice)

  // Rebase rewards, APY, rebase
  pm.nextDistributedClam = getNextCLAMRebase()
  let apy_rebase = getAPY_Rebase(pm.sClamCirculatingSupply, pm.nextDistributedClam)
  pm.currentAPY = apy_rebase[0]
  pm.nextEpochRebase = apy_rebase[1]
  if (transaction.blockNumber.gt(BigInt.fromString(PEARL_CHEST_BLOCK))) {
    let chestAPYs = getAPY_PearlChest(pm.nextEpochRebase)
    pm.safeHandAPY = chestAPYs[0]
    pm.furryHandAPY = chestAPYs[1]
    pm.stoneHandAPY = chestAPYs[2]
    pm.diamondHandAPY = chestAPYs[3]
  }

  //Total burned CLAM
  let burns = loadOrCreateTotalBurnedClamSingleton()
  pm.totalBurnedClam = burns.burnedClam
  pm.totalBurnedClamMarketValue = burns.burnedValueUsd

  pm.save()
}
