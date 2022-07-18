import { DYST_ROUTER, QUICKSWAP_ROUTER } from '../Constants';
import { DystExchange } from './dyst';
import { UniExchange } from './uni'

export { Exchange } from './exchange'
export const dyst = new DystExchange(DYST_ROUTER)
export const quickSwap = new UniExchange(QUICKSWAP_ROUTER)