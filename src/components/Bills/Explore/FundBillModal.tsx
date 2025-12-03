"use client";

import React, { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XIcon } from "lucide-react";
import Button from "@/components/Form/Button";
import Label from "@/components/Form/Label";
import Input from "@/components/Form/Input";
import useToast from "@/hooks/toast.hook";
import { Controller, FieldValues, useForm } from "react-hook-form";
import ShowError from "@/components/Form/ShowError";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useDexa } from "@/context/dexa.context";
import { Bills } from "@/interfaces/bills.interface";
import { Tokens } from "@/libs/tokens";
import { ZeroAddress, parseEther, parseUnits } from "ethers";
import { toOxString, weiToUnit } from "@/libs/helpers";

type Props = {
  bill: Bills;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

function FundBillModal({ isOpen, setIsOpen, bill }: Props) {
  const token = Tokens.find((t) => t.address == bill.billToken);
  const {
    watch,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const amount = watch("amount");
  const { address } = useAccount();
  const { error, success, loading } = useToast();
  const [request, setRequest] = useState<boolean>(false);
  const [requestHash, setRequestHash] = useState<`0x${string}`>();
  const { writeContractAsync, isPending } = useWriteContract();
  const { FundingAbi, FundingAddr, ERC20ABI } = useDexa();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: requestHash,
    });

  const { data: allowance } = useReadContract({
    abi: ERC20ABI,
    functionName: "allowance",
    address: toOxString(bill.billToken),
    args: [toOxString(address), FundingAddr],
    scopeKey: bill.billToken,
  });

  useEffect(() => {
    if (request || !isConfirmed || !amount || !requestHash) return;
    (async () => {
      await fundBill();
    })();
  }, [request, isConfirmed, amount, requestHash]);

  useEffect(() => {
    if (!amount) return;
    const isAllowed = weiToUnit(`${allowance}`) >= Number(amount);
    setRequest(!isAllowed);
  }, [allowance, amount]);

  const onSubmit = async (payload: FieldValues) => {
    try {
      const { amount } = payload;
      const isReq = request && bill.billToken != ZeroAddress;
      if (isReq) {
        loading({
          msg: "Requesting permission",
        });
        await writeContractAsync(
          {
            abi: ERC20ABI,
            address: toOxString(bill.billToken),
            functionName: "approve",
            args: [FundingAddr, parseEther(amount)],
          },
          {
            onSuccess: async (data) => {
              success({ msg: "Permission granted" });
              setRequest(false);
              setRequestHash(data);
            },
            onError(error, variables, context) {
              console.log(error);
            },
          }
        );
        return;
      }
      await fundBill();
    } catch (err) {
      console.log(err);
      if (err instanceof Error) {
        error({ msg: err.message });
      }
      if (err && typeof err === "object") {
        error({ msg: JSON.stringify(err) });
      }
    }
  };

  const fundBill = async () => {
    loading({
      msg: "Funding...",
    });
    await writeContractAsync(
      {
        abi: FundingAbi,
        address: FundingAddr,
        functionName: "fundBill",
        args: [bill.id, bill.billToken, parseEther(`${amount}`)],
      },
      {
        onSuccess: async (data) => {
          success({
            msg: `Bill funded`,
          });
          closeModal();
          resetForm();
        },
        onError(err) {
          error({ msg: `${err.message}` });
        },
      }
    );
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const resetForm = () => {
    reset();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50  overflow-y-auto scrollbar-hide"
        onClose={closeModal}
      >
        <div className="min-h-screen bg-white md:bg-transparent md:px-4 text-center">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-dark/50" />
          </TransitionChild>
          <span></span>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="inline-block w-full max-w-lg max-h-svh md:max-h-[45rem] pb-5 md:pb-5 md:my-10 overflow-scroll scrollbar-hide text-left align-middle transition-all transform bg-white md:shadow-2xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg px-4 py-2 flex top-0 sticky z-20 bg-white border-b border-light justify-between items-center leading-6 m-0 text-dark/80"
              >
                <div className="flex items-center gap-x-2">
                  <span className="font-bold">Fund Bill</span>
                </div>
                <Button
                  shape={"CIRCLE"}
                  kind="clear"
                  type={"button"}
                  onClick={closeModal}
                  className={"hover:bg-medium/20"}
                >
                  <XIcon size={22} />
                </Button>
              </DialogTitle>
              <div className="flex flex-col gap-5 px-5 pt-2 ">
                <div className="flex flex-col gap-3 md:gap-4">
                  <div className="flex-1">
                    <Label title="Amount" isMargin={true} isRequired={true} />
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <div className="flex items-center relative bg-white border rounded-md border-medium/60 px-3 overflow-hidden">
                          {token && <token.icon />}
                          <Input
                            type={"text"}
                            isOutline={false}
                            className="bg-white text-base"
                            placeholder="0.01"
                            onChange={onChange}
                            value={value ? value : ""}
                          />
                        </div>
                      )}
                      rules={{
                        required: "Enter funding amount",
                        min: 0,
                      }}
                      name={"amount"}
                    />
                    {errors.amount && (
                      <ShowError error={`${errors.amount?.message}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mt-2 items-center">
                      <div className="flex flex-col"></div>
                      <div>
                        <Button
                          type={"submit"}
                          kind={"primary"}
                          onClick={handleSubmit(onSubmit)}
                          disabled={isSubmitting || isPending || isConfirming}
                        >
                          <div className="flex items-center justify-center">
                            <p>{`Send fund`}</p>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export default FundBillModal;
