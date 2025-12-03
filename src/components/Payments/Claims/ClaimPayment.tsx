"use client";

import React, { useEffect, useState } from "react";
import { useWriteContract } from "wagmi";
import { useAppSelector } from "@/hooks/redux.hook";
import { selectConnector } from "@/slices/account/auth.slice";
import Button from "@/components/Form/Button";
import useToast from "@/hooks/toast.hook";
import { useDexa } from "@/context/dexa.context";
import { initClaimFund } from "@/actions/request.action";
import { BadgeDollarSign } from "lucide-react";
import { useClaimPay } from "@/context/claim-pay.context";
import { Tokens } from "@/libs/tokens";
import { Token } from "@/interfaces/transaction.interface";
import { formatWalletAddress } from "@/libs/helpers";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { TokenClaimed } from "./TokenClaimed";
import { toUtf8String } from "ethers";

function ClaimPaymentView() {
  const router = useRouter();
  const { wallet } = useAppSelector(selectConnector);
  const { success, loading, error } = useToast();
  const { writeContractAsync } = useWriteContract();
  const { GatewayAbi, GatewayAddr } = useDexa();
  const [token, setToken] = useState<Token>();
  const { payment, otp, email, paymentCode, isClaimed, setIsClaimed } =
    useClaimPay();
  const {
    handleSubmit,
    formState: { isSubmitting, isLoading },
  } = useForm();

  useEffect(() => {
    if (payment) {
      const token = Tokens.find((t) => t.address == payment.tokenAddress);
      setToken(token);
    }
  }, [payment]);

  const onSubmit = async () => {
    try {
      loading({ msg: "Processing..." });
      const response = await initClaimFund({
        ownerAddress: wallet || "",
        email: email || "",
        paymentCode: paymentCode || "",
        otp: otp || "",
      });
      if (response.status !== true) {
        error({ msg: response.message || "Something went wrong" });
        return;
      }
      const {
        sig,
        email: emailHash,
        paymentId: payIdHash,
        tokenAddress,
      } = response.data;
      console.log(response);
      await writeContractAsync(
        {
          abi: GatewayAbi,
          address: GatewayAddr,
          functionName: "claimEmailBalance",
          args: [emailHash, tokenAddress, payIdHash, sig],
        },
        {
          onSuccess: async (data) => {
            console.log(data);
            success({ msg: "Token claimed to your wallet address" });
            setIsClaimed(true);
          },
          onError(err: any) {
            // const msg = getError(err);
            error({ msg: err.message || "Something went wrong" });
          },
        }
      );
    } catch (err: any) {
      console.log(err);
      //   const msg = getError(err);
      error({ msg: err.message || "Something went wrong" });
    }
  };

  return (
    <>
      {isClaimed ? (
        <TokenClaimed />
      ) : (
        <div className="bg-white p-8 rounded-lg">
          <div className="mb-5">
            <div className="flex items-center gap-x-1">
              <BadgeDollarSign
                size={20}
                className="text-white rounded-full bg-primary"
              />
              <p className="text-xl font-bold text-dark">Claim your token</p>
            </div>

            <p className="text-medium text-sm font-light">
              You can now withdraw your token to your dexa account
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-medium text-sm">You Get...</p>
                <p className="text-2xl font-bold">
                  {payment?.amount} {payment?.tokenSymbol}
                </p>
              </div>
              <div>{token?.icon && <token.icon />}</div>
            </div>

            <div className="flex flex-col gap-5 mt-3">
              <Button
                onClick={handleSubmit(onSubmit)}
                shape={"NORMAL"}
                type="button"
                className="h-12"
                kind="primary"
                disabled={isSubmitting || isLoading}
              >
                Claim {payment?.amount} {payment?.tokenSymbol}
              </Button>
            </div>
            <div className="text-center">
              <p className="text-medium text-sm -mt-2">
                Thanks for using Dexa, keep it going.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClaimPaymentView;
