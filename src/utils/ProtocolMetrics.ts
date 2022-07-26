import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { ClamCirculatingSupply } from '../../generated/OtterQiLocker/ClamCirculatingSupply'
import { xTetuQi } from '../../generated/OtterQiLocker/xTetuQi'
import { ERC20 } from '../../generated/OtterQiLocker/ERC20'
import { OtterClamERC20V2 } from '../../generated/OtterQiLocker/OtterClamERC20V2'
import { OtterQiDAOInvestment } from '../../generated/OtterQiLocker/OtterQiDAOInvestment'
import { QiFarm } from '../../generated/OtterQiLocker/QiFarm'
import { veDyst } from '../../generated/OtterQiLocker/veDyst'
import { PenLens } from '../../generated/OtterQiLocker/PenLens'
import { UniswapV2Pair } from '../../generated/OtterQiLocker/UniswapV2Pair'
import { CurveMai3poolContract } from '../../generated/OtterQiLocker/CurveMai3poolContract'
import { PenDystRewards } from '../../generated/OtterQiLocker/PenDystRewards'
import { PenrosePartnerRewards } from '../../generated/OtterQiLocker/PenrosePartnerRewards'
import { PenLockerV2 } from '../../generated/OtterQiLocker/PenLockerV2'
import { ProtocolMetric, Transaction, VotePosition, Vote, GovernanceMetric } from '../../generated/schema'
import {
  CIRCULATING_SUPPLY_CONTRACT,
  CIRCULATING_SUPPLY_CONTRACT_BLOCK,
  CLAM_ERC20,
  DAI_ERC20,
  MAI_ERC20,
  MATIC_ERC20,
  OCQI_CONTRACT,
  QCQI_START_BLOCK,
  TETU_QI_START_BLOCK,
  XTETU_QI_CONTRACT,
  XTETU_QI_START_BLOCK,
  QI_ERC20,
  TREASURY_ADDRESS,
  UNI_CLAM_MAI_PAIR,
  UNI_MAI_USDC_QI_INVESTMENT_PAIR,
  UNI_MAI_USDC_QI_INVESTMENT_PAIR_BLOCK,
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
  DYSTOPIA_veDYST,
  DYSTOPIA_veDYST_ERC721_ID,
  DYSTOPIA_TRACKED_PAIRS,
  DYSTOPIA_PAIR_USDPLUS_CLAM,
  PEN_ERC20,
  PENDYST_ERC20,
  DAO_WALLET_PENROSE_USER_PROXY,
  PEN_DYST_REWARD_PROXY,
  VLPEN_LOCKER,
  PENROSE_LENS_PROXY,
  QIDAO_veDYST_ERC721_ID,
  PEN_DYST_PARTNER_REWARDS,
  DYST_START_BLOCK,
  PEN_START_BLOCK,
  DYSTOPIA_PAIR_QI_TETUQI,
  TETU_QI_ERC20,
  PENROSE_REWARD_WMATIC_DYST,
  PENROSE_REWARD_MAI_CLAM,
  PENROSE_REWARD_USDPLUS_CLAM,
  PENROSE_REWARD_QI_TETUQI,
  UNI_MAI_USDC_PAIR,
} from './Constants'
import { dayFromTimestamp } from './Dates'
import { toDecimal } from './Decimals'
import {
  getClamUsdRate,
  getwMaticUsdRate,
  getDystUsdRate,
  getDystPairUSD,
  findPrice,
  getQiUsdRate,
  getPenDystUsdRate,
  getPenUsdRate,
  getTetuQiUsdRate,
  getDystPairHalfReserveUSD,
  ReserveToken,
  getUniPairUSD,
} from './Price'
import { loadOrCreateTotalBurnedClamSingleton } from '../utils/Burned'
import { DystPair } from '../../generated/OtterQiLocker/DystPair'
import { PenroseMultiRewards } from '../../generated/PenrosePartnerRewards/PenroseMultiRewards'

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric {
  let dayTimestamp = dayFromTimestamp(timestamp)

  let protocolMetric = ProtocolMetric.load(dayTimestamp)
  if (protocolMetric == null) {
    protocolMetric = new ProtocolMetric(dayTimestamp)
    protocolMetric.timestamp = timestamp
    protocolMetric.clamCirculatingSupply = BigDecimal.zero()
    protocolMetric.totalSupply = BigDecimal.zero()
    protocolMetric.clamPrice = BigDecimal.zero()
    protocolMetric.marketCap = BigDecimal.zero()
    protocolMetric.treasuryMaiUsdcQiInvestmentValue = BigDecimal.zero()
    protocolMetric.treasuryMarketValue = BigDecimal.zero()
    protocolMetric.treasuryMaiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryWmaticMarketValue = BigDecimal.zero()
    protocolMetric.treasuryQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryTetuQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryQiWmaticMarketValue = BigDecimal.zero()
    protocolMetric.treasuryQiWmaticQiInvestmentMarketValue = BigDecimal.zero()
    protocolMetric.treasuryOtterClamQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryClamMaiPOL = BigDecimal.zero()
    protocolMetric.totalBurnedClam = BigDecimal.zero()
    protocolMetric.totalBurnedClamMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairQiTetuQiMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairUSDPLUSClamMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairMaiClamMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystopiaPairwMaticDystMarketValue = BigDecimal.zero()
    protocolMetric.treasuryDystMarketValue = BigDecimal.zero()
    protocolMetric.treasuryVeDystMarketValue = BigDecimal.zero()
    protocolMetric.treasuryPenDystMarketValue = BigDecimal.zero()

    protocolMetric.save()
  }
  return protocolMetric as ProtocolMetric
}

export function loadOrCreateGovernanceMetric(timestamp: BigInt): GovernanceMetric {
  let dayTimestamp = dayFromTimestamp(timestamp)

  let governanceMetric = GovernanceMetric.load(dayTimestamp)
  if (governanceMetric == null) {
    governanceMetric = new GovernanceMetric(dayTimestamp)
    governanceMetric.timestamp = timestamp
    governanceMetric.qiDaoVeDystAmt = BigDecimal.zero()
    governanceMetric.qiDaoVeDystAmt = BigDecimal.zero()
    governanceMetric.dystMarketCap = BigDecimal.zero()
    governanceMetric.veDystMarketCap = BigDecimal.zero()
    governanceMetric.penDystMarketCap = BigDecimal.zero()
    governanceMetric.vlPenMarketCap = BigDecimal.zero()
    governanceMetric.otterClamVlPenMarketCap = BigDecimal.zero()
    governanceMetric.otterClamVlPenPercentOwned = BigDecimal.zero()
    governanceMetric.otterClamVeDystPercentOwned = BigDecimal.zero()

    governanceMetric.save()
  }
  return governanceMetric as GovernanceMetric
}

function getTotalSupply(): BigDecimal {
  let clam_contract = OtterClamERC20V2.bind(CLAM_ERC20)
  let total_supply = toDecimal(clam_contract.totalSupply(), 9)
  log.debug('Total Supply {}', [total_supply.toString()])
  return total_supply
}

function getCirculatingSupply(transaction: Transaction, total_supply: BigDecimal): BigDecimal {
  let circ_supply = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(CIRCULATING_SUPPLY_CONTRACT_BLOCK))) {
    let circulatingSupply_contract = ClamCirculatingSupply.bind(CIRCULATING_SUPPLY_CONTRACT)
    circ_supply = toDecimal(circulatingSupply_contract.CLAMCirculatingSupply(), 9)
  } else {
    circ_supply = total_supply
  }
  log.debug('Circulating Supply {}', [total_supply.toString()])
  return circ_supply
}

function getMai3poolValue(): BigDecimal {
  let mai3pool = CurveMai3poolContract.bind(CURVE_MAI_3POOL_PAIR)
  let balance = toDecimal(mai3pool.balanceOf(TREASURY_ADDRESS), 18)
  let price = toDecimal(mai3pool.get_virtual_price(), 18)
  let value = balance.times(price)
  log.debug('MAI3Pool balance {}, price {}, value {}', [balance.toString(), price.toString(), value.toString()])
  return value
}

function getMai3poolInvestmentValue(): BigDecimal {
  let mai3pool = CurveMai3poolContract.bind(CURVE_MAI_3POOL_PAIR)
  let investment = ERC20.bind(CURVE_MAI_3POOL_INVESTMENT_PAIR)
  let balance = toDecimal(investment.balanceOf(TREASURY_ADDRESS), 18)
  let price = toDecimal(mai3pool.get_virtual_price(), 18)
  let value = balance.times(price)
  log.debug('MAI3Pool investment balance {}, price {}, value {}', [
    balance.toString(),
    price.toString(),
    value.toString(),
  ])
  return value
}

function getMaiUsdcInvestmentValue(): BigDecimal {
  let pair = OtterQiDAOInvestment.bind(UNI_MAI_USDC_QI_INVESTMENT_PAIR)
  let reserves = pair.getReserves()
  let usdc = toDecimal(reserves.value0, 6)
  let mai = toDecimal(reserves.value1, 18)
  log.debug('investment mai {}, usdc {}', [mai.toString(), usdc.toString()])

  let balance = pair.balanceOf(TREASURY_ADDRESS).toBigDecimal()
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
  let pair = UniswapV2Pair.bind(UNI_QI_WMATIC_PAIR)
  let reserves = pair.getReserves()
  let wmatic = toDecimal(reserves.value0, 18)
  let qi = toDecimal(reserves.value1, 18)
  log.debug('pair qi {}, wmatic {}', [qi.toString(), wmatic.toString()])

  let balance = pair.balanceOf(TREASURY_ADDRESS).toBigDecimal()

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
  let pair = OtterQiDAOInvestment.bind(UNI_QI_WMATIC_INVESTMENT_PAIR)
  let reserves = pair.getReserves()
  let wmatic = toDecimal(reserves.value0, 18)
  let qi = toDecimal(reserves.value1, 18)
  log.debug('investment wmatic {}, qi {}', [qi.toString(), wmatic.toString()])

  let balance = pair.balanceOf(TREASURY_ADDRESS).toBigDecimal()
  let farm = QiFarm.bind(QI_FARM)
  let deposited = farm.deposited(BigInt.fromU64(4), OTTER_QI_LOCKER).toBigDecimal()

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

export function getTreasuryTokenValue(blockNumber: BigInt, address: Address): BigDecimal {
  let usdPerToken = findPrice(blockNumber, address)
  let token = ERC20.bind(address)
  let tokenBalance = toDecimal(token.balanceOf(TREASURY_ADDRESS), token.decimals()).plus(
    toDecimal(token.balanceOf(DAO_WALLET), token.decimals()),
  )
  let marketValue = tokenBalance.times(usdPerToken)
  return marketValue
}

/* Mutates the provided ProtocolMetric by setting the relevant properties*/
function setTreasuryAssetMarketValues(transaction: Transaction, protocolMetric: ProtocolMetric): ProtocolMetric {
  let maiERC20 = ERC20.bind(MAI_ERC20)
  let daiERC20 = ERC20.bind(DAI_ERC20)
  let maticERC20 = ERC20.bind(MATIC_ERC20)
  let qiERC20 = ERC20.bind(QI_ERC20)
  let tetuQiERC20 = ERC20.bind(TETU_QI_ERC20)

  let xTetuQiERC20 = xTetuQi.bind(XTETU_QI_CONTRACT)

  let clamMaiPair = UniswapV2Pair.bind(UNI_CLAM_MAI_PAIR)

  let maiBalance = toDecimal(maiERC20.balanceOf(TREASURY_ADDRESS), 18)
  let daiBalance = toDecimal(daiERC20.balanceOf(TREASURY_ADDRESS), 18)

  let wmaticBalance = maticERC20.balanceOf(TREASURY_ADDRESS)
  let wmaticValue = toDecimal(wmaticBalance, 18).times(getwMaticUsdRate())

  //CLAM-MAI Quickswap
  let clamMaiBalance = clamMaiPair.balanceOf(TREASURY_ADDRESS)

  let clamMaiTotalLP = toDecimal(clamMaiPair.totalSupply(), 18)
  let clamMaiPOL = toDecimal(clamMaiBalance, 18)
    .div(clamMaiTotalLP)
    .times(BigDecimal.fromString('100'))
  let clamMai_value = getUniPairUSD(transaction.blockNumber, clamMaiBalance, UNI_CLAM_MAI_PAIR)

  let clamMai_MaiOnlyValue = toDecimal(clamMaiPair.getReserves().value0, 18).times(
    clamMaiPOL.div(BigDecimal.fromString('100')),
  )

  let qiMarketValue = BigDecimal.zero()
  let maiUsdcQiInvestmentValueDecimal = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(UNI_MAI_USDC_QI_INVESTMENT_PAIR_BLOCK))) {
    maiUsdcQiInvestmentValueDecimal = getMaiUsdcInvestmentValue()
    qiMarketValue = getQiUsdRate().times(toDecimal(qiERC20.balanceOf(TREASURY_ADDRESS), qiERC20.decimals()))
  }

  let maiUsdcMarketValue = getUniPairUSD(
    transaction.blockNumber,
    ERC20.bind(UNI_MAI_USDC_PAIR).balanceOf(TREASURY_ADDRESS),
    UNI_MAI_USDC_PAIR,
  )

  let tetuQiMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(TETU_QI_START_BLOCK))) {
    tetuQiMarketValue = tetuQiMarketValue.plus(
      getTetuQiUsdRate(transaction.blockNumber).times(
        toDecimal(tetuQiERC20.balanceOf(TREASURY_ADDRESS), tetuQiERC20.decimals()),
      ),
    )
  }
  if (transaction.blockNumber.gt(BigInt.fromString(XTETU_QI_START_BLOCK))) {
    tetuQiMarketValue = tetuQiMarketValue.plus(
      getTetuQiUsdRate(transaction.blockNumber).times(
        toDecimal(xTetuQiERC20.underlyingBalanceWithInvestmentForHolder(TREASURY_ADDRESS), xTetuQiERC20.decimals()),
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

  let ocQiMarketValue = BigDecimal.zero()
  if (transaction.blockNumber.gt(BigInt.fromString(QCQI_START_BLOCK))) {
    ocQiMarketValue = getTreasuryTokenValue(transaction.blockNumber, OCQI_CONTRACT)
  }

  //DYSTOPIA & PENROSE
  let qiTetuQiValue = BigDecimal.zero()
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

  let clamMaiDystLpOwned = BigInt.zero()
  let clamUsdPlusDystLpOwned = BigInt.zero()
  if (transaction.blockNumber.gt(BigInt.fromI32(DYST_START_BLOCK))) {
    dystMarketValue = getTreasuryTokenValue(transaction.blockNumber, DYST_ERC20)

    for (let i = 0; i < DYSTOPIA_TRACKED_PAIRS.length; i++) {
      let pair_address = DYSTOPIA_TRACKED_PAIRS[i]
      //first check if the DAO wallet holds LP tokens directly
      let dystopiaPair = DystPair.bind(pair_address)
      let pairDystBalance = dystopiaPair.try_balanceOf(DAO_WALLET)
      if (pairDystBalance.reverted) continue
      let pairValue = getDystPairUSD(transaction.blockNumber, pairDystBalance.value, pair_address)
      //then add the Gauge staked LP balance from Penrose

      let penroseRewardBalance = BigInt.zero()

      //finally, associate with relevant property
      if (pair_address == DYSTOPIA_PAIR_WMATIC_DYST) {
        let penroseRewards = PenroseMultiRewards.bind(PENROSE_REWARD_WMATIC_DYST).try_balanceOf(
          DAO_WALLET_PENROSE_USER_PROXY,
        )
        penroseRewardBalance = penroseRewards.reverted ? BigInt.zero() : penroseRewards.value
        wMaticDystValue = pairValue.plus(getDystPairUSD(transaction.blockNumber, penroseRewardBalance, pair_address))
      }
      if (pair_address == DYSTOPIA_PAIR_MAI_CLAM) {
        let penroseRewards = PenroseMultiRewards.bind(PENROSE_REWARD_MAI_CLAM).try_balanceOf(
          DAO_WALLET_PENROSE_USER_PROXY,
        )
        penroseRewardBalance = penroseRewards.reverted ? BigInt.zero() : penroseRewards.value
        clamMaiDystValue = pairValue.plus(getDystPairUSD(transaction.blockNumber, penroseRewardBalance, pair_address))
        clamMaiDystLpOwned = pairDystBalance.value.plus(penroseRewardBalance)
      }
      if (pair_address == DYSTOPIA_PAIR_USDPLUS_CLAM) {
        let penroseRewards = PenroseMultiRewards.bind(PENROSE_REWARD_USDPLUS_CLAM).try_balanceOf(
          DAO_WALLET_PENROSE_USER_PROXY,
        )
        penroseRewardBalance = penroseRewards.reverted ? BigInt.zero() : penroseRewards.value
        clamUsdplusDystValue = pairValue.plus(
          getDystPairUSD(transaction.blockNumber, penroseRewardBalance, pair_address),
        )
        clamUsdPlusDystLpOwned = pairDystBalance.value.plus(penroseRewardBalance)
      }
      if (pair_address == DYSTOPIA_PAIR_QI_TETUQI) {
        let penroseRewards = PenroseMultiRewards.bind(PENROSE_REWARD_QI_TETUQI).try_balanceOf(
          DAO_WALLET_PENROSE_USER_PROXY,
        )
        penroseRewardBalance = penroseRewards.reverted ? BigInt.zero() : penroseRewards.value

        qiTetuQiValue = pairValue.plus(getDystPairUSD(transaction.blockNumber, penroseRewardBalance, pair_address))
      }
    }

    //plus the locked veDyst inside NFT
    let veDystContract = veDyst.bind(DYSTOPIA_veDYST)
    veDystMarketValue = toDecimal(veDystContract.balanceOfNFT(BigInt.fromString(DYSTOPIA_veDYST_ERC721_ID)), 18).times(
      getDystUsdRate(),
    )
  }

  //add stablecoin-only half of Dystopia CLAM-X LPs
  clamMai_MaiOnlyValue = clamMai_MaiOnlyValue.plus(
    getDystPairHalfReserveUSD(
      transaction.blockNumber,
      clamMaiDystLpOwned,
      DYSTOPIA_PAIR_MAI_CLAM,
      ReserveToken.TokenZero, //MAI is token0
    ),
  )

  let clamUsdPlus_UsdPlusOnlyValue = getDystPairHalfReserveUSD(
    transaction.blockNumber,
    clamUsdPlusDystLpOwned,
    DYSTOPIA_PAIR_USDPLUS_CLAM,
    ReserveToken.TokenZero, //USD+ is token0
  )

  if (transaction.blockNumber.gt(BigInt.fromI32(PEN_START_BLOCK))) {
    penMarketValue = getTreasuryTokenValue(transaction.blockNumber, PEN_ERC20)
    let penDyst = ERC20.bind(PENDYST_ERC20)
    let penDystStaking = PenDystRewards.bind(PEN_DYST_REWARD_PROXY)
    let penDystStaking2 = PenrosePartnerRewards.bind(PEN_DYST_PARTNER_REWARDS)

    let penDystAmount = toDecimal(
      penDyst
        .balanceOf(DAO_WALLET)
        .plus(penDyst.balanceOf(DAO_WALLET_PENROSE_USER_PROXY))
        .plus(penDystStaking.balanceOf(DAO_WALLET_PENROSE_USER_PROXY))
        .plus(penDystStaking2.balanceOf(DAO_WALLET_PENROSE_USER_PROXY)),
      18,
    )

    penDystMarketValue = penDystAmount.times(getPenDystUsdRate())

    let vlPenContract = PenLockerV2.bind(VLPEN_LOCKER)
    let vlPenAmt = toDecimal(vlPenContract.balanceOf(DAO_WALLET_PENROSE_USER_PROXY), 18)
    vlPenMarketValue = vlPenAmt.times(getPenUsdRate())
    log.debug('Pen MV {};   PenDyst Amount {} MV {};  vlPEN Amt {} MV {}', [
      penMarketValue.toString(),
      penDystAmount.toString(),
      penDystMarketValue.toString(),
      vlPenAmt.toString(),
      vlPenMarketValue.toString(),
    ])
  }
  let stableValueDecimal = maiBalance
    .plus(daiBalance)
    .plus(maiUsdcQiInvestmentValueDecimal)
    .plus(maiUsdcMarketValue)

  let lpValue_noClam = clamMai_value
    .plus(qiWmaticMarketValue)
    .plus(qiWmaticQiInvestmentMarketValue)
    //dystopia
    .plus(qiTetuQiValue)
    .plus(wMaticDystValue)
    .plus(usdcMaiDystValue)
    .plus(usdcFraxDystValue)
    .plus(wMaticPenValue)

  let lpValue_Clam = lpValue_noClam.plus(clamMai_MaiOnlyValue).plus(clamUsdPlus_UsdPlusOnlyValue)

  let tokenValues = wmaticValue
    .plus(qiMarketValue)
    .plus(ocQiMarketValue)
    .plus(tetuQiMarketValue)
    .plus(dystMarketValue)
    .plus(veDystMarketValue)
    .plus(penMarketValue)
    .plus(vlPenMarketValue)
    .plus(penDystMarketValue)

  let mv = stableValueDecimal.plus(lpValue_Clam).plus(tokenValues)

  let mv_noClam = stableValueDecimal.plus(lpValue_noClam).plus(tokenValues)

  protocolMetric.treasuryMarketValue = mv
  protocolMetric.treasuryMarketValueWithoutClam = mv_noClam
  protocolMetric.treasuryMaiUsdcMarketValue = maiUsdcMarketValue
  protocolMetric.treasuryMaiUsdcQiInvestmentValue = maiUsdcQiInvestmentValueDecimal
  protocolMetric.treasuryMaiMarketValue = maiBalance
  protocolMetric.treasuryClamMaiMarketValue = clamMai_value
  protocolMetric.treasuryQiMarketValue = qiMarketValue
  protocolMetric.treasuryQiWmaticMarketValue = qiWmaticMarketValue
  protocolMetric.treasuryQiWmaticQiInvestmentMarketValue = qiWmaticQiInvestmentMarketValue
  protocolMetric.treasuryOtterClamQiMarketValue = ocQiMarketValue
  protocolMetric.treasuryTetuQiMarketValue = tetuQiMarketValue
  protocolMetric.treasuryClamMaiPOL = clamMaiPOL
  protocolMetric.treasuryDystopiaPairQiTetuQiMarketValue = qiTetuQiValue
  protocolMetric.treasuryDystopiaPairwMaticDystMarketValue = wMaticDystValue
  protocolMetric.treasuryDystopiaPairMaiClamMarketValue = clamMaiDystValue
  protocolMetric.treasuryDystopiaPairUSDPLUSClamMarketValue = clamUsdplusDystValue
  protocolMetric.treasuryDystMarketValue = dystMarketValue
  protocolMetric.treasuryVeDystMarketValue = veDystMarketValue
  protocolMetric.treasuryPenMarketValue = penMarketValue
  protocolMetric.treasuryVlPenMarketValue = vlPenMarketValue
  protocolMetric.treasuryPenDystMarketValue = penDystMarketValue

  return protocolMetric
}

export function updateProtocolMetrics(transaction: Transaction): void {
  let pm = loadOrCreateProtocolMetric(transaction.timestamp)

  //Set metrics
  pm = setTreasuryAssetMarketValues(transaction, pm)
  let circSupply = getCirculatingSupply(transaction, pm.totalSupply)
  pm.totalSupply = getTotalSupply()
  pm.clamCirculatingSupply = circSupply
  pm.clamPrice = getClamUsdRate(transaction.blockNumber)
  pm.marketCap = circSupply.times(pm.clamPrice)
  pm.clamBacking = pm.treasuryMarketValueWithoutClam.div(circSupply)

  //Total burned CLAM
  let burns = loadOrCreateTotalBurnedClamSingleton()
  pm.totalBurnedClam = burns.burnedClam
  pm.totalBurnedClamMarketValue = burns.burnedValueUsd

  pm.save()
  //Also trigger a Governance Metrics update
  updateGovernanceMetrics(transaction)
}

export function updateGovernanceMetrics(transaction: Transaction): void {
  /*Penrose Votes
  PenLens.json ABI has been stripped out to contain only the `votePositionsOf` function,
  because GraphQL cannot parse functions which return nested lists e.g. type[][]
  Quick Google says this is a long-standing issue https://github.com/graphprotocol/graph-cli/issues/342
  but there has been activity during June 2022, 
  so fingers crossed this will be fixed before we need a function of that signature.
  */
  if (transaction.blockNumber.lt(BigInt.fromString('29400000'))) return

  let governanceMetric = loadOrCreateGovernanceMetric(transaction.timestamp)
  let voteSingleton = loadOrCreateVotePositionSingleton()
  let voteContract = PenLens.bind(PENROSE_LENS_PROXY)

  let tryVoteTuple = voteContract.try_votePositionsOf(DAO_WALLET_PENROSE_USER_PROXY)
  let currentVotes: string[] = []
  if (!tryVoteTuple.reverted) {
    let voteTuple = tryVoteTuple.value
    for (let i = 0; i < voteTuple.votes.length; i++) {
      let vote = new Vote(voteTuple.votes[i].poolAddress.toHexString())
      vote.vote = toDecimal(voteTuple.votes[i].weight, 18)
      vote.timestamp = transaction.timestamp
      vote.save()

      log.debug('Penrose vote of {} vlPen for pool {} @ time {}', [
        vote.vote.toString(),
        vote.id,
        transaction.timestamp.toString(),
      ])
      currentVotes.push(vote.id)
    }
    voteSingleton.votes = currentVotes
    voteSingleton.save()
  }

  //Calculate our vlPEN voting power in DYST
  let penDyst = ERC20.bind(PENDYST_ERC20)
  let vlPenContract = PenLockerV2.bind(VLPEN_LOCKER)
  let vlPenAmt = toDecimal(vlPenContract.balanceOf(DAO_WALLET_PENROSE_USER_PROXY), 18)

  let penLockedDyst = toDecimal(penDyst.totalSupply(), 18)
  let vlPenTotal = ERC20.bind(PEN_ERC20).balanceOf(VLPEN_LOCKER)

  let percentVlPenOwned = vlPenAmt.div(toDecimal(vlPenTotal, 18))
  let finalDystWeight = percentVlPenOwned.times(penLockedDyst)

  let veDystTotalSupply = toDecimal(veDyst.bind(DYSTOPIA_veDYST).totalSupply(), 18)
  let percentVeDystWeight = finalDystWeight.div(veDystTotalSupply).times(BigDecimal.fromString('100'))
  percentVlPenOwned = percentVlPenOwned.times(BigDecimal.fromString('100'))

  //QiDAO veDYST votes
  let qiDaoVeDystAmt = toDecimal(veDyst.bind(DYSTOPIA_veDYST).balanceOfNFT(BigInt.fromI32(QIDAO_veDYST_ERC721_ID)), 18)
  // funnel chart
  governanceMetric.dystMarketCap = toDecimal(ERC20.bind(DYST_ERC20).totalSupply(), 18).times(getDystUsdRate())
  governanceMetric.veDystMarketCap = veDystTotalSupply.times(getDystUsdRate())
  governanceMetric.penDystMarketCap = toDecimal(penDyst.totalSupply(), 18).times(getPenDystUsdRate())
  governanceMetric.vlPenMarketCap = toDecimal(vlPenContract.totalSupply(), 18).times(getPenUsdRate())
  governanceMetric.otterClamVlPenMarketCap = vlPenAmt.times(getPenUsdRate())
  // funnel chart metrics
  governanceMetric.otterClamVlPenPercentOwned = percentVlPenOwned
  governanceMetric.otterClamVeDystPercentOwned = percentVeDystWeight

  // QiDao metrics
  governanceMetric.qiDaoVeDystAmt = qiDaoVeDystAmt

  log.debug('Governance Metrics for date {}: OtterClam vlPen owned%: {}, OtterClam equivalent veDYST owned%: {}', [
    transaction.timestamp.toString(),
    percentVlPenOwned.toString(),
    percentVeDystWeight.toString(),
  ])

  governanceMetric.save()
}

export function loadOrCreateVotePositionSingleton(): VotePosition {
  let votes = VotePosition.load('1')
  if (votes == null) {
    votes = new VotePosition('1')
    votes.votes = []
    votes.save()
  }
  return votes
}
