import { Address, BigInt } from '@graphprotocol/graph-ts'
import { DystRouter } from '../../../generated/OtterClamERC20V2/DystRouter'
import { Exchange } from './exchange'

export class DystExchange implements Exchange {
  public readonly router: DystRouter

  constructor(routerAddress: Address) {
    this.router = DystRouter.bind(routerAddress)
  }

  getAmountOut(inAmount: BigInt, inToken: Address, outToken: Address): BigInt {
    const result = this.router.getAmountOut(inAmount, inToken, outToken)
    return result.value0
  }
}
