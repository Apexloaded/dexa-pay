import { useMemo, useState } from "react";
import { useDexa } from "@/context/dexa.context";
import useToast from "../toast.hook";
import { ZeroAddress, parseEther } from "ethers";
import { useAuth } from "@/context/auth.context";
import { useAccount, useWriteContract } from "wagmi";
import { useCapabilities, useWriteContracts } from "wagmi/experimental";
import { toOxString } from "@/libs/helpers";
import useDexaCapabilities from "../capabilities.hook";

interface IDepostFunction {
  token: string;
  amount: string;
  closeModal: () => void;
  resetForm: () => void;
  tokenName: string;
}

interface ISubmit extends IDepostFunction {
  setRequest: React.Dispatch<React.SetStateAction<boolean>>;
  request: boolean;
  setRequestHash: React.Dispatch<
    React.SetStateAction<`0x${string}` | undefined>
  >;
}

function useDeposit() {
  const { GatewayAddr, GatewayAbi, ERC20ABI } = useDexa();
  const { loading, error, success } = useToast();
  const { address, chainId } = useAccount();
  const { isSmartWallet } = useAuth();
  const { writeContractAsync, isPending: isContPending } = useWriteContract();
  const { writeContractsAsync, isPending: isContsPending } =
    useWriteContracts();
  const capabilities = useDexaCapabilities({ address, chainId, isSmartWallet });

  const onSubmit = async ({
    token,
    amount,
    request,
    setRequest,
    setRequestHash,
    resetForm,
    tokenName,
    closeModal,
  }: ISubmit) => {
    try {
      const isReq = request && token != ZeroAddress;
      if (isReq) {
        loading({
          msg: "Requesting permission",
        });
        await writeContractAsync(
          {
            abi: ERC20ABI,
            address: toOxString(token),
            functionName: "approve",
            args: [GatewayAddr, parseEther(`${amount}`)],
          },
          {
            onSuccess: async (data) => {
              success({ msg: "Permission granted" });
              setRequest(false);
              setRequestHash(data);
            },
          }
        );
        return;
      }
      await deposit({ token, amount, closeModal, resetForm, tokenName });
    } catch (err) {
      if (err instanceof Error) {
        error({ msg: err.message });
      }
      if (err && typeof err === "object") {
        error({ msg: JSON.stringify(err) });
      }
    }
  };

  const deposit = async ({
    token,
    amount,
    closeModal,
    resetForm,
    tokenName,
  }: IDepostFunction) => {
    try {
      loading({
        msg: "Depositing",
      });
      const isZero = token == ZeroAddress;
      const contractProps: any = {
        abi: GatewayAbi,
        address: GatewayAddr,
        functionName: "deposit",
        args: [parseEther(`${amount}`), token],
      };
      if (isZero) {
        contractProps.value = parseEther(`${amount}`);
      }

      if (isSmartWallet) {
        await writeContractsAsync(
          {
            contracts: [{ ...contractProps }],
            capabilities,
          },
          {
            onSuccess: async (data) => {
              success({
                msg: `${amount} ${tokenName} deposited`,
              });
              closeModal();
              resetForm();
            },
            onError(err) {
              error({ msg: `${err.message}` });
            },
          }
        );
      } else {
        await writeContractAsync(
          { ...contractProps },
          {
            onSuccess: async (data) => {
              success({
                msg: `${amount} ${tokenName} deposited`,
              });
              closeModal();
              resetForm();
            },
            onError(err) {
              error({ msg: `${err.message}` });
            },
          }
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        error({ msg: err.message });
      }
      if (err && typeof err === "object") {
        error({ msg: JSON.stringify(err) });
      }
    }
  };

  return { deposit, isPending: isContPending || isContsPending, onSubmit };
}

export default useDeposit;
