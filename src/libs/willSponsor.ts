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
import { GATEWAY_CONTRACT } from "@/config/constants";
const dexaPayAddr = toOxString(GATEWAY_CONTRACT);
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
  // check chain id
  //   console.log("chain", chainId);
  //   console.log("baseSepolia", baseSepolia.id);
  //   console.log("chain id: ", chainId !== baseSepolia.id);
  //   if (chainId !== baseSepolia.id) return false;

  // check entrypoint
  // not strictly needed given below check on implementation address, but leaving as example
  console.log(
    "entrypoint: ",
    entrypoint.toLowerCase() !== ENTRYPOINT_ADDRESS_V06.toLowerCase()
  );
  if (entrypoint.toLowerCase() !== ENTRYPOINT_ADDRESS_V06.toLowerCase())
    return false;

  try {
    // check the userOp.sender is a proxy with the expected bytecode
    const code = await client.getBytecode({ address: userOp.sender });

    if (!code) {
      // no code at address, check that the initCode is deploying a Coinbase Smart Wallet
      // factory address is first 20 bytes of initCode after '0x'
      const factoryAddress = userOp.initCode.slice(0, 42);
      console.log(
        "is factory address 20 bytes",
        factoryAddress.toLowerCase() !==
          coinbaseSmartWalletFactoryAddress.toLowerCase()
      );
      if (
        factoryAddress.toLowerCase() !==
        coinbaseSmartWalletFactoryAddress.toLowerCase()
      )
        return false;
    } else {
      // code at address, check that it is a proxy to the expected implementation
      console.log("code at address", code != coinbaseSmartWalletProxyBytecode);
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
      console.log(
        "userOp.sender",
        implementationAddress != coinbaseSmartWalletV1Implementation
      );
      if (implementationAddress != coinbaseSmartWalletV1Implementation)
        return false;
    }

    // check that userOp.callData is making a call we want to sponsor
    const calldata = decodeFunctionData({
      abi: coinbaseSmartWalletABI,
      data: userOp.callData,
    });

    // keys.coinbase.com always uses executeBatch
    console.log("executeBatch", calldata.functionName !== "executeBatch");
    if (calldata.functionName !== "executeBatch") return false;
    console.log("calldata args", !calldata.args || calldata.args.length < 1);
    if (!calldata.args || calldata.args.length < 1) return false;

    const calls = calldata.args[0] as {
      target: Address;
      value: bigint;
      data: Hex;
    }[];
    // modify if want to allow batch calls to your contract
    console.log("call length", calls.length > 2);
    if (calls.length > 2) return false;

    let callToCheckIndex = 0;
    if (calls.length > 1) {
      // if there is more than one call, check if the first is a magic spend call
      console.log(
        "is more than one magic spend",
        calls[0].target.toLowerCase() !== magicSpendAddress.toLowerCase()
      );
      if (calls[0].target.toLowerCase() !== magicSpendAddress.toLowerCase())
        return false;
      callToCheckIndex = 1;
    }

    console.log(
      "dexa pay address",
      calls[callToCheckIndex].target.toLowerCase() !== dexaPayAddr.toLowerCase()
    );
    if (
      calls[callToCheckIndex].target.toLowerCase() !== dexaPayAddr.toLowerCase()
    )
      return false;

    const innerCalldata = decodeFunctionData({
      abi: DexaPay,
      data: calls[callToCheckIndex].data,
    });
    console.log("is pay by email", innerCalldata.functionName !== "payByEmail");
    if (innerCalldata.functionName !== "payByEmail") return false;

    console.log("TRUE");
    return true;
  } catch (e) {
    console.error(`willSponsor check failed: ${e}`);
    return false;
  }
}
