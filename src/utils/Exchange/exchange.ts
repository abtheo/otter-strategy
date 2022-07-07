import { Address, BigInt } from '@graphprotocol/graph-ts'

export interface Exchange {
    getAmountOut(inAmount: BigInt, inToken: Address, outToken: Address): BigInt
}