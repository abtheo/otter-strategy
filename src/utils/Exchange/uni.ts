import { Address, BigInt } from '@graphprotocol/graph-ts'
import { UniswapV2Router02 } from '../../../generated/Dyst/UniswapV2Router02'
import { Exchange } from './exchange'

export class UniExchange implements Exchange {
    private readonly router: UniswapV2Router02

    constructor(routerAddress: Address) {
        this.router = UniswapV2Router02.bind(routerAddress)
    }

    getAmountOut(inAmount: BigInt, inToken: Address, outToken: Address): BigInt {
        const result = this.router.getAmountsOut(inAmount, [inToken, outToken])
        if (!result[0]) {
            return BigInt.zero()
        }
        return result[0]
    }
}