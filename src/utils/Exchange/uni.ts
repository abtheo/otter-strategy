import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Router02 } from '../../../generated/OtterClamERC20V2/UniswapV2Router02'
import { Exchange } from './exchange'

export class UniExchange implements Exchange {
  public readonly router: UniswapV2Router02

  constructor(routerAddress: Address) {
    this.router = UniswapV2Router02.bind(routerAddress)
  }

  getAmountOut(inAmount: BigInt, inToken: Address, outToken: Address): BigInt {
    const result = this.router.getAmountsOut(inAmount, [inToken, outToken])
    return result[1]
  }
}
