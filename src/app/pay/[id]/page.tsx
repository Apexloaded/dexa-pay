"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useDexa } from "@/context/dexa.context";
import { Tokens } from "@/libs/tokens";
import { Token } from "@/interfaces/transaction.interface";
import {
  FulfilledPaymentEvent,
  IPaymentRequest,
  mapReq
} from "@/interfaces/pay-request.interface";
import { selectConnector } from "@/slices/account/auth.slice";
import { useAppSelector } from "@/hooks/redux.hook";
import {
  hexlify,
  decodeBase64,
  ZeroAddress,
  parseEther,
} from "ethers";
import { baseSepolia } from "viem/chains";
import Button from "@/components/Form/Button";
import Image from "next/image";
import { favicon } from "@/components/Icons/Connector";
import WalletConnectModal from "@/components/Auth/WalletConnectModal";
import useToast from "@/hooks/toast.hook";
import useSocket from "@/hooks/socket.hook";
import { RequestStatus, SocketEvents } from "@/libs/enums";
import { toOxString, weiToUnit } from "@/libs/helpers";

function Pay() {
  const { id } = useParams();
  const { GatewayAbi, GatewayAddr, ERC20ABI } = useDexa();
  const { emit } = useSocket();
  const { address } = useAccount();
  const [hexId, setHexId] = useState<string>();
  const [token, setToken] = useState<Token>();
  const { loading, error, success } = useToast();
  const [request, setRequest] = useState<IPaymentRequest>();
  const { isConnected } = useAppSelector(selectConnector);
  const [connectModal, setConnectModal] = useState<boolean>(false);
  const [isRequest, setIsRequest] = useState<boolean>(false);
  const [requestHash, setRequestHash] = useState<`0x${string}`>();
  const { writeContractAsync, isPending } = useWriteContract();
  const { data, isLoading } = useReadContract({
    abi: GatewayAbi,
    address: GatewayAddr,
    functionName: "getRequest",
    args: [hexId],
    query: { enabled: !!hexId },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: requestHash,
    });

  const { data: allowance } = useReadContract({
    abi: ERC20ABI,
    functionName: "allowance",
    address: toOxString(`${request?.token}`),
    args: [toOxString(address), GatewayAddr],
    scopeKey: `${request?.token}`,
  });

  useEffect(() => {
    if (isRequest || !isConfirmed || !request?.amount || !requestHash) return;
    (async () => {
      await payBill();
    })();
  }, [isRequest, isConfirmed, request?.amount, requestHash]);

  useEffect(() => {
    if (!request?.amount) return;
    const unit = weiToUnit(`${allowance}`);
    const check = unit >= Number(request.amount);
    setIsRequest(!check);
  }, [allowance, request?.amount]);

  useEffect(() => {
    if (id) {
      const hex = hexlify(decodeBase64(decodeURIComponent(id.toString())));
      setHexId(hex);
    }
  }, [id]);

  useEffect(() => {
    if (data) {
      const mappedRequest = mapReq(data as IPaymentRequest);
      const token = Tokens.find((t) => t.address == mappedRequest.token);
      setToken(token);
      setRequest(mappedRequest);
    }
  }, [data]);

  const initPay = async () => {
    if (!isConnected) {
      setConnectModal(true);
      return;
    }
    const isReq = isRequest && request?.token != ZeroAddress;
    if (isReq) {
      loading({
        msg: "Requesting permission",
      });
      await writeContractAsync(
        {
          abi: ERC20ABI,
          address: toOxString(`${request?.token}`),
          functionName: "approve",
          args: [GatewayAddr, parseEther(`${request?.amount}`)],
        },
        {
          onSuccess: async (data) => {
            success({ msg: "Permission granted" });
            setIsRequest(false);
            setRequestHash(data);
          },
        }
      );
      return;
    }
    await payBill();
  };

  const payBill = async () => {
    try {
      loading({
        msg: "Initiating payment",
      });
      await writeContractAsync(
        {
          abi: GatewayAbi,
          address: GatewayAddr,
          functionName: "fulfillRequest",
          args: [hexId],
        },
        {
          onSuccess: async (data) => {
            // emit<FulfilledPaymentEvent>(SocketEvents.PaymentSent, {
            //   email,
            //   paymentCode: payId,
            // });
            success({
              msg: `${request?.amount} ${token?.symbol} paid`,
            });
          },
          onError(err) {
            error({ msg: `${err.message}` });
          },
        }
      );
    } catch (err) {}
  };

  return (
    <div className="bg-primary/10 pt-40 h-svh">
      {connectModal && <WalletConnectModal setModal={setConnectModal} />}
      <div className="max-w-xl mx-auto bg-white p-5 shadow-md rounded-xl">
        <div className="flex justify-start items-center gap-x-2">
          <Image
            src={favicon.main}
            width={260}
            height={260}
            alt={`dexa`}
            className="h-10 w-10"
          />
          <p className="font-bold text-2xl">Dexa Pay</p>
        </div>

        <div className="mt-5">
          <p className="text-sm mb-1">Network and Coin</p>
          <div className="border border-medium/20 shadow-sm rounded-md grid grid-cols-3">
            <div className="col-span-2 pl-3 py-2">
              <p>{baseSepolia.name}</p>
            </div>
            <div className="flex items-center gap-x-2 border-l border-medium/20 pl-3 py-2">
              {token && <token.icon />}
              <p>{token?.symbol}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm">Currency conversion</p>
            {/* <p>1 BNB = 1 USDT</p> */}
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm">Amount to pay</p>
            <p>
              {request?.amount} {token?.symbol}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="font-semibold mb-1 text-medium">Biller address</p>
          <div className="mt-1 rounded-md border border-medium/20 py-2 px-3">
            <p className="text-sm text-medium">{request?.sender}</p>
          </div>
        </div>

        <div className="w-full mt-10">
          <Button
            kind="primary"
            className="w-full h-12"
            onClick={initPay}
            disabled={request?.status == RequestStatus.Fulfilled || isPending}
          >
            {request?.status == RequestStatus.Fulfilled ? (
              "Paid"
            ) : (
              <>
                {!isConnected
                  ? "Connect to pay"
                  : `Pay ${request?.amount} ${token?.symbol}`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Pay;
