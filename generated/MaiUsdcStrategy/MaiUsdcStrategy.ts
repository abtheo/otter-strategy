// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class AdminChanged extends ethereum.Event {
  get params(): AdminChanged__Params {
    return new AdminChanged__Params(this);
  }
}

export class AdminChanged__Params {
  _event: AdminChanged;

  constructor(event: AdminChanged) {
    this._event = event;
  }

  get previousAdmin(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newAdmin(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class BeaconUpgraded extends ethereum.Event {
  get params(): BeaconUpgraded__Params {
    return new BeaconUpgraded__Params(this);
  }
}

export class BeaconUpgraded__Params {
  _event: BeaconUpgraded;

  constructor(event: BeaconUpgraded) {
    this._event = event;
  }

  get beacon(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class ClaimReward extends ethereum.Event {
  get params(): ClaimReward__Params {
    return new ClaimReward__Params(this);
  }
}

export class ClaimReward__Params {
  _event: ClaimReward;

  constructor(event: ClaimReward) {
    this._event = event;
  }

  get amount(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class Invest extends ethereum.Event {
  get params(): Invest__Params {
    return new Invest__Params(this);
  }
}

export class Invest__Params {
  _event: Invest;

  constructor(event: Invest) {
    this._event = event;
  }

  get amount(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class PortfolioManagerUpdated extends ethereum.Event {
  get params(): PortfolioManagerUpdated__Params {
    return new PortfolioManagerUpdated__Params(this);
  }
}

export class PortfolioManagerUpdated__Params {
  _event: PortfolioManagerUpdated;

  constructor(event: PortfolioManagerUpdated) {
    this._event = event;
  }

  get value(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class ReinvestRateUpdated extends ethereum.Event {
  get params(): ReinvestRateUpdated__Params {
    return new ReinvestRateUpdated__Params(this);
  }
}

export class ReinvestRateUpdated__Params {
  _event: ReinvestRateUpdated;

  constructor(event: ReinvestRateUpdated) {
    this._event = event;
  }

  get value(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class RoleAdminChanged extends ethereum.Event {
  get params(): RoleAdminChanged__Params {
    return new RoleAdminChanged__Params(this);
  }
}

export class RoleAdminChanged__Params {
  _event: RoleAdminChanged;

  constructor(event: RoleAdminChanged) {
    this._event = event;
  }

  get role(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get previousAdminRole(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }

  get newAdminRole(): Bytes {
    return this._event.parameters[2].value.toBytes();
  }
}

export class RoleGranted extends ethereum.Event {
  get params(): RoleGranted__Params {
    return new RoleGranted__Params(this);
  }
}

export class RoleGranted__Params {
  _event: RoleGranted;

  constructor(event: RoleGranted) {
    this._event = event;
  }

  get role(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get account(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get sender(): Address {
    return this._event.parameters[2].value.toAddress();
  }
}

export class RoleRevoked extends ethereum.Event {
  get params(): RoleRevoked__Params {
    return new RoleRevoked__Params(this);
  }
}

export class RoleRevoked__Params {
  _event: RoleRevoked;

  constructor(event: RoleRevoked) {
    this._event = event;
  }

  get role(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get account(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get sender(): Address {
    return this._event.parameters[2].value.toAddress();
  }
}

export class Upgraded extends ethereum.Event {
  get params(): Upgraded__Params {
    return new Upgraded__Params(this);
  }
}

export class Upgraded__Params {
  _event: Upgraded;

  constructor(event: Upgraded) {
    this._event = event;
  }

  get implementation(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class MaiUsdcStrategy extends ethereum.SmartContract {
  static bind(address: Address): MaiUsdcStrategy {
    return new MaiUsdcStrategy("MaiUsdcStrategy", address);
  }

  DAO(): Address {
    let result = super.call("DAO", "DAO():(address)", []);

    return result[0].toAddress();
  }

  try_DAO(): ethereum.CallResult<Address> {
    let result = super.tryCall("DAO", "DAO():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  DEFAULT_ADMIN_ROLE(): Bytes {
    let result = super.call(
      "DEFAULT_ADMIN_ROLE",
      "DEFAULT_ADMIN_ROLE():(bytes32)",
      []
    );

    return result[0].toBytes();
  }

  try_DEFAULT_ADMIN_ROLE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "DEFAULT_ADMIN_ROLE",
      "DEFAULT_ADMIN_ROLE():(bytes32)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  MANAGER_ROLE(): Bytes {
    let result = super.call("MANAGER_ROLE", "MANAGER_ROLE():(bytes32)", []);

    return result[0].toBytes();
  }

  try_MANAGER_ROLE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall("MANAGER_ROLE", "MANAGER_ROLE():(bytes32)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  PORTFOLIO_MANAGER(): Bytes {
    let result = super.call(
      "PORTFOLIO_MANAGER",
      "PORTFOLIO_MANAGER():(bytes32)",
      []
    );

    return result[0].toBytes();
  }

  try_PORTFOLIO_MANAGER(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "PORTFOLIO_MANAGER",
      "PORTFOLIO_MANAGER():(bytes32)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  USDC(): Address {
    let result = super.call("USDC", "USDC():(address)", []);

    return result[0].toAddress();
  }

  try_USDC(): ethereum.CallResult<Address> {
    let result = super.tryCall("USDC", "USDC():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  WMATIC(): Address {
    let result = super.call("WMATIC", "WMATIC():(address)", []);

    return result[0].toAddress();
  }

  try_WMATIC(): ethereum.CallResult<Address> {
    let result = super.tryCall("WMATIC", "WMATIC():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  claimAndReinvest(to_: Address): BigInt {
    let result = super.call(
      "claimAndReinvest",
      "claimAndReinvest(address):(uint256)",
      [ethereum.Value.fromAddress(to_)]
    );

    return result[0].toBigInt();
  }

  try_claimAndReinvest(to_: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "claimAndReinvest",
      "claimAndReinvest(address):(uint256)",
      [ethereum.Value.fromAddress(to_)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  curveMaiFactory(): Address {
    let result = super.call(
      "curveMaiFactory",
      "curveMaiFactory():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_curveMaiFactory(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "curveMaiFactory",
      "curveMaiFactory():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  curveZap(): Address {
    let result = super.call("curveZap", "curveZap():(address)", []);

    return result[0].toAddress();
  }

  try_curveZap(): ethereum.CallResult<Address> {
    let result = super.tryCall("curveZap", "curveZap():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getRoleAdmin(role: Bytes): Bytes {
    let result = super.call("getRoleAdmin", "getRoleAdmin(bytes32):(bytes32)", [
      ethereum.Value.fromFixedBytes(role)
    ]);

    return result[0].toBytes();
  }

  try_getRoleAdmin(role: Bytes): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "getRoleAdmin",
      "getRoleAdmin(bytes32):(bytes32)",
      [ethereum.Value.fromFixedBytes(role)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  hasRole(role: Bytes, account: Address): boolean {
    let result = super.call("hasRole", "hasRole(bytes32,address):(bool)", [
      ethereum.Value.fromFixedBytes(role),
      ethereum.Value.fromAddress(account)
    ]);

    return result[0].toBoolean();
  }

  try_hasRole(role: Bytes, account: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall("hasRole", "hasRole(bytes32,address):(bool)", [
      ethereum.Value.fromFixedBytes(role),
      ethereum.Value.fromAddress(account)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  mai(): Address {
    let result = super.call("mai", "mai():(address)", []);

    return result[0].toAddress();
  }

  try_mai(): ethereum.CallResult<Address> {
    let result = super.tryCall("mai", "mai():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  manager(): Address {
    let result = super.call("manager", "manager():(address)", []);

    return result[0].toAddress();
  }

  try_manager(): ethereum.CallResult<Address> {
    let result = super.tryCall("manager", "manager():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  portfolioManager(): Address {
    let result = super.call(
      "portfolioManager",
      "portfolioManager():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_portfolioManager(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "portfolioManager",
      "portfolioManager():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  proxiableUUID(): Bytes {
    let result = super.call("proxiableUUID", "proxiableUUID():(bytes32)", []);

    return result[0].toBytes();
  }

  try_proxiableUUID(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "proxiableUUID",
      "proxiableUUID():(bytes32)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  qi(): Address {
    let result = super.call("qi", "qi():(address)", []);

    return result[0].toAddress();
  }

  try_qi(): ethereum.CallResult<Address> {
    let result = super.tryCall("qi", "qi():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  quickSwapRouter(): Address {
    let result = super.call(
      "quickSwapRouter",
      "quickSwapRouter():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_quickSwapRouter(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "quickSwapRouter",
      "quickSwapRouter():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  reinvestRate(): BigInt {
    let result = super.call("reinvestRate", "reinvestRate():(uint256)", []);

    return result[0].toBigInt();
  }

  try_reinvestRate(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("reinvestRate", "reinvestRate():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  supportsInterface(interfaceId: Bytes): boolean {
    let result = super.call(
      "supportsInterface",
      "supportsInterface(bytes4):(bool)",
      [ethereum.Value.fromFixedBytes(interfaceId)]
    );

    return result[0].toBoolean();
  }

  try_supportsInterface(interfaceId: Bytes): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "supportsInterface",
      "supportsInterface(bytes4):(bool)",
      [ethereum.Value.fromFixedBytes(interfaceId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  treasury(): Address {
    let result = super.call("treasury", "treasury():(address)", []);

    return result[0].toAddress();
  }

  try_treasury(): ethereum.CallResult<Address> {
    let result = super.tryCall("treasury", "treasury():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  usdc(): Address {
    let result = super.call("usdc", "usdc():(address)", []);

    return result[0].toAddress();
  }

  try_usdc(): ethereum.CallResult<Address> {
    let result = super.tryCall("usdc", "usdc():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  usdcMai(): Address {
    let result = super.call("usdcMai", "usdcMai():(address)", []);

    return result[0].toAddress();
  }

  try_usdcMai(): ethereum.CallResult<Address> {
    let result = super.tryCall("usdcMai", "usdcMai():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  usdcMaiInvestment(): Address {
    let result = super.call(
      "usdcMaiInvestment",
      "usdcMaiInvestment():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_usdcMaiInvestment(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "usdcMaiInvestment",
      "usdcMaiInvestment():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class ClaimAndReinvestCall extends ethereum.Call {
  get inputs(): ClaimAndReinvestCall__Inputs {
    return new ClaimAndReinvestCall__Inputs(this);
  }

  get outputs(): ClaimAndReinvestCall__Outputs {
    return new ClaimAndReinvestCall__Outputs(this);
  }
}

export class ClaimAndReinvestCall__Inputs {
  _call: ClaimAndReinvestCall;

  constructor(call: ClaimAndReinvestCall) {
    this._call = call;
  }

  get to_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class ClaimAndReinvestCall__Outputs {
  _call: ClaimAndReinvestCall;

  constructor(call: ClaimAndReinvestCall) {
    this._call = call;
  }

  get value0(): BigInt {
    return this._call.outputValues[0].value.toBigInt();
  }
}

export class EmergencyWithdrawCall extends ethereum.Call {
  get inputs(): EmergencyWithdrawCall__Inputs {
    return new EmergencyWithdrawCall__Inputs(this);
  }

  get outputs(): EmergencyWithdrawCall__Outputs {
    return new EmergencyWithdrawCall__Outputs(this);
  }
}

export class EmergencyWithdrawCall__Inputs {
  _call: EmergencyWithdrawCall;

  constructor(call: EmergencyWithdrawCall) {
    this._call = call;
  }

  get token_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class EmergencyWithdrawCall__Outputs {
  _call: EmergencyWithdrawCall;

  constructor(call: EmergencyWithdrawCall) {
    this._call = call;
  }
}

export class GrantRoleCall extends ethereum.Call {
  get inputs(): GrantRoleCall__Inputs {
    return new GrantRoleCall__Inputs(this);
  }

  get outputs(): GrantRoleCall__Outputs {
    return new GrantRoleCall__Outputs(this);
  }
}

export class GrantRoleCall__Inputs {
  _call: GrantRoleCall;

  constructor(call: GrantRoleCall) {
    this._call = call;
  }

  get role(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get account(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class GrantRoleCall__Outputs {
  _call: GrantRoleCall;

  constructor(call: GrantRoleCall) {
    this._call = call;
  }
}

export class InitializeCall extends ethereum.Call {
  get inputs(): InitializeCall__Inputs {
    return new InitializeCall__Inputs(this);
  }

  get outputs(): InitializeCall__Outputs {
    return new InitializeCall__Outputs(this);
  }
}

export class InitializeCall__Inputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class InitializeCall__Outputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class RenounceRoleCall extends ethereum.Call {
  get inputs(): RenounceRoleCall__Inputs {
    return new RenounceRoleCall__Inputs(this);
  }

  get outputs(): RenounceRoleCall__Outputs {
    return new RenounceRoleCall__Outputs(this);
  }
}

export class RenounceRoleCall__Inputs {
  _call: RenounceRoleCall;

  constructor(call: RenounceRoleCall) {
    this._call = call;
  }

  get role(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get account(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class RenounceRoleCall__Outputs {
  _call: RenounceRoleCall;

  constructor(call: RenounceRoleCall) {
    this._call = call;
  }
}

export class RevokeRoleCall extends ethereum.Call {
  get inputs(): RevokeRoleCall__Inputs {
    return new RevokeRoleCall__Inputs(this);
  }

  get outputs(): RevokeRoleCall__Outputs {
    return new RevokeRoleCall__Outputs(this);
  }
}

export class RevokeRoleCall__Inputs {
  _call: RevokeRoleCall;

  constructor(call: RevokeRoleCall) {
    this._call = call;
  }

  get role(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get account(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class RevokeRoleCall__Outputs {
  _call: RevokeRoleCall;

  constructor(call: RevokeRoleCall) {
    this._call = call;
  }
}

export class SetPortfolioManagerCall extends ethereum.Call {
  get inputs(): SetPortfolioManagerCall__Inputs {
    return new SetPortfolioManagerCall__Inputs(this);
  }

  get outputs(): SetPortfolioManagerCall__Outputs {
    return new SetPortfolioManagerCall__Outputs(this);
  }
}

export class SetPortfolioManagerCall__Inputs {
  _call: SetPortfolioManagerCall;

  constructor(call: SetPortfolioManagerCall) {
    this._call = call;
  }

  get value_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetPortfolioManagerCall__Outputs {
  _call: SetPortfolioManagerCall;

  constructor(call: SetPortfolioManagerCall) {
    this._call = call;
  }
}

export class SetReinvestRateCall extends ethereum.Call {
  get inputs(): SetReinvestRateCall__Inputs {
    return new SetReinvestRateCall__Inputs(this);
  }

  get outputs(): SetReinvestRateCall__Outputs {
    return new SetReinvestRateCall__Outputs(this);
  }
}

export class SetReinvestRateCall__Inputs {
  _call: SetReinvestRateCall;

  constructor(call: SetReinvestRateCall) {
    this._call = call;
  }

  get rate_(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetReinvestRateCall__Outputs {
  _call: SetReinvestRateCall;

  constructor(call: SetReinvestRateCall) {
    this._call = call;
  }
}

export class UpgradeToCall extends ethereum.Call {
  get inputs(): UpgradeToCall__Inputs {
    return new UpgradeToCall__Inputs(this);
  }

  get outputs(): UpgradeToCall__Outputs {
    return new UpgradeToCall__Outputs(this);
  }
}

export class UpgradeToCall__Inputs {
  _call: UpgradeToCall;

  constructor(call: UpgradeToCall) {
    this._call = call;
  }

  get newImplementation(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class UpgradeToCall__Outputs {
  _call: UpgradeToCall;

  constructor(call: UpgradeToCall) {
    this._call = call;
  }
}

export class UpgradeToAndCallCall extends ethereum.Call {
  get inputs(): UpgradeToAndCallCall__Inputs {
    return new UpgradeToAndCallCall__Inputs(this);
  }

  get outputs(): UpgradeToAndCallCall__Outputs {
    return new UpgradeToAndCallCall__Outputs(this);
  }
}

export class UpgradeToAndCallCall__Inputs {
  _call: UpgradeToAndCallCall;

  constructor(call: UpgradeToAndCallCall) {
    this._call = call;
  }

  get newImplementation(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get data(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }
}

export class UpgradeToAndCallCall__Outputs {
  _call: UpgradeToAndCallCall;

  constructor(call: UpgradeToAndCallCall) {
    this._call = call;
  }
}
