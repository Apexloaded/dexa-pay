import { PINATA_GATEWAY, PINATA_GATEWAY_KEY, PINATA_JWT } from '@/config/constants';
import { PinataSDK } from 'pinata-web3';

export const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
  pinataGatewayKey: PINATA_GATEWAY_KEY,
});
