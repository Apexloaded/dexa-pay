import { NextRequest, NextResponse } from "next/server";
import { UserOperation } from "permissionless";
import {
  isValidAAEntrypoint,
  isWalletACoinbaseSmartWallet,
} from "@coinbase/onchainkit/wallet";
import type {
  IsValidAAEntrypointOptions,
  IsWalletACoinbaseSmartWalletOptions,
} from "@coinbase/onchainkit/wallet";
import { client, paymasterClient } from "@/libs/paymasterClient";
import { willSponsor } from "@/libs/willSponsor";

export async function POST(r: Request) {
  const req = await r.json();
  console.log(req);
  const method = req.method;
  const [userOp, entrypoint, chainId] = req.params;
  const sponsorable = await willSponsor({ chainId, entrypoint, userOp });
  if (!sponsorable) {
    return Response.json({ error: "Not a sponsorable operation" });
  }

  if (method === "pm_getPaymasterStubData") {
    const result = await paymasterClient.getPaymasterStubData({
      userOperation: userOp,
    });
    return Response.json({ result });
  } else if (method === "pm_getPaymasterData") {
    const result = await paymasterClient.getPaymasterData({
      userOperation: userOp,
    });
    return Response.json({ result });
  }
  return Response.json({ error: "Method not found" });
}

export const dynamic = "force-dynamic";