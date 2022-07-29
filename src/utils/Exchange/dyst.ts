import { Address, BigInt } from '@graphprotocol/graph-ts'
import { DystRouter } from '../../../generated/OtterQiLocker/DystRouter'
import { Exchange } from './exchange'

export class DystExchange implements Exchange {
  private readonly router: DystRouter

  constructor(routerAddress: Address) {
    this.router = DystRouter.bind(routerAddress)
  }

  getAmountOut(inAmount: BigInt, inToken: Address, outToken: Address): BigInt {
    const result = this.router.getAmountOut(inAmount, inToken, outToken)
    return result.value0
  }
}
