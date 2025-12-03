import { baseSepolia } from "viem/chains";

export const EXPECTED_CHAIN = baseSepolia;
export const BASE_RPC_URL = "/api/rpc";
export const GATEWAY_CONTRACT = process.env.NEXT_PUBLIC_GATEWAY_CONTRACT || "";
export const FUNDING_CONTRACT = process.env.NEXT_PUBLIC_FUNDING_CONTRACT || "";
export const TAXES_CONTRACT = process.env.NEXT_PUBLIC_TAXES_CONTRACT || "";
export const HOSTNAME = process.env.NEXT_PUBLIC_HOSTNAME || "https://www.dexapay.xyz";
export const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL;
export const RECAPTCHA_SECRET =
  process.env.NEXT_PRIVATE_RECAPTCHA_SECRET_KEY || "";
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const API = process.env.NEXT_PUBLIC_API_URL;

export const PINATA_JWT = process.env.NEXT_PRIVATE_PINATA_JWT || "";
export const PINATA_GATEWAY = process.env.NEXT_PRIVATE_PINATA_GATEWAY || "";
export const PINATA_GATEWAY_KEY =
  process.env.NEXT_PRIVATE_PINATA_GATEWAY_KEY || "";
export const IPFS_URL = process.env.NEXT_PUBLIC_IPFS_URL || "ipfs.dweb.link";

export const coinbaseSmartWalletProxyBytecode =
  "0x363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3";
export const coinbaseSmartWalletV1Implementation =
  "0x000100abaad02f1cfC8Bbe32bD5a564817339E72";
export const coinbaseSmartWalletFactoryAddress =
  "0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a";
export const magicSpendAddress = "0x011A61C07DbF256A68256B1cB51A5e246730aB92";
export const erc1967ProxyImplementationSlot =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
