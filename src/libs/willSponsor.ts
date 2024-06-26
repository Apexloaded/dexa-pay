import { ENTRYPOINT_ADDRESS_V06, UserOperation } from "permissionless";
import {
  Address,
  BlockTag,
  Hex,
  decodeAbiParameters,
  decodeFunctionData,
} from "viem";
import { baseSepolia } from "viem/chains";
import { client } from "./paymasterClient";
import {
  coinbaseSmartWalletFactoryAddress,
  coinbaseSmartWalletProxyBytecode,
  coinbaseSmartWalletV1Implementation,
  erc1967ProxyImplementationSlot,
  magicSpendAddress,
} from "@/config/constants";
import coinbaseSmartWalletABI from "@/contracts/PayMaster";
import DexaPay from "@/contracts/DexaPay";
import { DEXA_PAY } from "@/config/constants";
const dexaPayAddr = toOxString(DEXA_PAY);
import { toOxString } from "./helpers";

export async function willSponsor({
  chainId,
  entrypoint,
  userOp,
}: {
  chainId: number;
  entrypoint: string;
  userOp: UserOperation<"v0.6">;
}) {
  console.log("HERE");
  // check chain id
  if (chainId !== baseSepolia.id) return false;
  // check entrypoint
  // not strictly needed given below check on implementation address, but leaving as example
  if (entrypoint.toLowerCase() !== ENTRYPOINT_ADDRESS_V06.toLowerCase())
    return false;

  try {
    // check the userOp.sender is a proxy with the expected bytecode
    const code = await client.getBytecode({ address: userOp.sender });

    if (!code) {
      // no code at address, check that the initCode is deploying a Coinbase Smart Wallet
      // factory address is first 20 bytes of initCode after '0x'
      const factoryAddress = userOp.initCode.slice(0, 42);
      if (
        factoryAddress.toLowerCase() !==
        coinbaseSmartWalletFactoryAddress.toLowerCase()
      )
        return false;
    } else {
      // code at address, check that it is a proxy to the expected implementation
      if (code != coinbaseSmartWalletProxyBytecode) return false;

      // check that userOp.sender proxies to expected implementation
      const implementation = await client.request<{
        Parameters: [Address, Hex, BlockTag];
        ReturnType: Hex;
      }>({
        method: "eth_getStorageAt",
        params: [userOp.sender, erc1967ProxyImplementationSlot, "latest"],
      });
      const implementationAddress = decodeAbiParameters(
        [{ type: "address" }],
        implementation
      )[0];
      if (implementationAddress != coinbaseSmartWalletV1Implementation)
        return false;
    }

    // check that userOp.callData is making a call we want to sponsor
    const calldata = decodeFunctionData({
      abi: coinbaseSmartWalletABI,
      data: userOp.callData,
    });

    // keys.coinbase.com always uses executeBatch
    if (calldata.functionName !== "executeBatch") return false;
    if (!calldata.args || calldata.args.length < 1) return false;

    const calls = calldata.args[0] as {
      target: Address;
      value: bigint;
      data: Hex;
    }[];
    // modify if want to allow batch calls to your contract
    if (calls.length > 2) return false;

    let callToCheckIndex = 0;
    if (calls.length > 1) {
      // if there is more than one call, check if the first is a magic spend call
      if (calls[0].target.toLowerCase() !== magicSpendAddress.toLowerCase())
        return false;
      callToCheckIndex = 1;
    }

    if (
      calls[callToCheckIndex].target.toLowerCase() !== dexaPayAddr.toLowerCase()
    )
      return false;

    const innerCalldata = decodeFunctionData({
      abi: DexaPay,
      data: calls[callToCheckIndex].data,
    });
    if (innerCalldata.functionName !== "payByEmail") return false;

    return true;
  } catch (e) {
    console.error(`willSponsor check failed: ${e}`);
    return false;
  }
}
