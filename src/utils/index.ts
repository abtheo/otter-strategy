import { Address, Bytes } from '@graphprotocol/graph-ts'

export function addressEqualsString(address1: Address, address2: string): boolean {
  return address1.toHexString().toLowerCase() == address2.toLowerCase()
}
export function bytesEqualsString(address1: Bytes, address2: string): boolean {
  return address1.toHexString().toLowerCase() == address2.toLowerCase()
}
