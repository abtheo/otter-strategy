import { Address, Bytes } from '@graphprotocol/graph-ts'

export function addressEqualsString(address1: Address | Bytes, address2: string): boolean {
  return address1.toHexString() === address2.toLowerCase()
}
