"use client";

import React, { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Label from "../Form/Label";
import Input from "../Form/Input";
import Button from "../Form/Button";
import { XIcon } from "lucide-react";
import Select, { Options } from "../Form/Select";
import { Tokens } from "@/libs/tokens";
import { useForm, Controller, FieldValues } from "react-hook-form";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatCur, toOxString, weiToUnit } from "@/libs/helpers";
import ShowError from "../Form/ShowError";
import { ZeroAddress } from "ethers";
import { useDexa } from "@/context/dexa.context";
import { depositResolver } from "@/schemas/deposit.schema";
import useDeposit from "@/hooks/transactions/deposit.hook";
import useToast from "@/hooks/toast.hook";
import { useAppDispatch, useAppSelector } from "@/hooks/redux.hook";
import { selectDepositModal, setDepositModal } from "@/slices/modals/modals.slice";

function DepositModal() {
  const {
    trigger,
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ ...depositResolver });
  const isOpen = useAppSelector(selectDepositModal);
  const dispatch = useAppDispatch();
  const { address } = useAccount();
  const [amount, setAmount] = useState<string>("0.00");
  const [resetKey, setResetKey] = useState<number>(0);
  const [request, setRequest] = useState<boolean>(false);
  const [requestHash, setRequestHash] = useState<`0x${string}`>();
  const [selectedToken, setSelectedToken] = useState<Options>();
  const [tokenBalance, setTokenBalance] = useState<number>();
  const { error } = useToast();
  const [options] = useState(
    Tokens.map((t) => {
      return { value: t.address, name: t.symbol, icon: t.icon };
    })
  );
  const { GatewayAddr, ERC20ABI } = useDexa();
  const { data: ethBalance } = useBalance({ address: address });
  const {
    isPending,
    deposit: initDeposit,
    onSubmit: initSubmit,
  } = useDeposit();

  const { data: allowance } = useReadContract({
    abi: ERC20ABI,
    functionName: "allowance",
    address: toOxString(selectedToken?.value),
    args: [toOxString(address), GatewayAddr],
    scopeKey: selectedToken?.value,
  });

  const { data: balance } = useReadContract({
    address: toOxString(selectedToken?.value),
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address],
    scopeKey: selectedToken?.value,
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: requestHash,
    });

  useEffect(() => {
    if (request || !isConfirmed || !amount || !requestHash) return;
    (async () => {
      if (!selectedToken?.value) return;
      await deposit(selectedToken.value, amount);
    })();
  }, [request, isConfirmed, amount, selectedToken?.value, requestHash]);

  useEffect(() => {
    if (!amount) return;
    const unit = weiToUnit(`${allowance}`);
    const isAllowed = unit >= Number(amount);
    setRequest(!isAllowed);
  }, [allowance, amount]);

  useEffect(() => {
    const init = () => {
      if (!balance && !ethBalance) return;
      const bal =
        selectedToken?.value == ZeroAddress ? ethBalance?.value : balance;
      setTokenBalance(weiToUnit(`${bal}`));
    };
    void init();
  }, [balance, ethBalance, selectedToken?.value]);

  const setMax = () => {
    if (!tokenBalance) return;
    const amount = tokenBalance;
    setValue("amount", amount);
    setAmount(`${amount}`);
    trigger("amount");
  };

  const onSubmit = async (payload: FieldValues) => {

      const { token, amount } = payload;
      await initSubmit({
        amount,
        request,
        setRequest,
        setRequestHash,
        resetForm,
        tokenName: `${selectedToken?.name}`,
        closeModal,
        token,
      });

  };

  const deposit = async (token: string, amount: string) => {
    await initDeposit({
      token,
      amount,
      closeModal: closeModal,
      resetForm: resetForm,
      tokenName: `${selectedToken?.name}`,
    });
  };

  const closeModal = () => {
    dispatch(setDepositModal(false));
    resetForm();
  };

  const resetForm = () => {
    setAmount("0.00");
    reset({ amount: undefined });
    setResetKey((prevKey) => prevKey + 1);
    setTokenBalance(undefined);
    setSelectedToken(undefined);
    setRequestHash(undefined);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto scrollbar-hide"
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

          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 transform-[scale(95%)]"
            enterTo="opacity-100 transform-[scale(100%)]"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 transform-[scale(100%)]"
            leaveTo="opacity-0 transform-[scale(95%)]"
          >
            <DialogPanel className="inline-block w-full max-w-xl max-h-svh md:max-h-[45rem] md:pb-10 md:my-8 overflow-scroll scrollbar-hide text-left align-middle transition-all transform bg-white md:shadow-2xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg px-4 py-2 flex top-0 sticky z-20 bg-white border-b border-light justify-between items-center leading-6 m-0 text-dark/80"
              >
                <div className="flex items-center gap-x-2">
                  <span className="font-bold">Deposit Funds</span>
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
              <div className="flex flex-col gap-5 md:gap-6 px-5 pt-2 ">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="flex-1">
                    <Label title="Token" isMargin={true} isRequired={true} />
                    <Controller
                      control={control}
                      render={({ field: { onChange } }) => (
                        <Select
                          options={options}
                          placeholder="Choose option"
                          onSelect={(token) => {
                            setSelectedToken(token);
                            onChange(token.value);
                          }}
                          key={resetKey}
                          className="bg-white border border-medium/60 rounded-md"
                        />
                      )}
                      name={"token"}
                    />
                    {errors.token && (
                      <ShowError error={`${errors.token?.message}`} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col gap-5">
                      <div className="flex-1">
                        <Label
                          title="Amount"
                          isMargin={true}
                          isRequired={true}
                        />
                        <Controller
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <div className="flex items-center overflow-hidden relative bg-white border rounded-md border-medium/60">
                              <Input
                                isOutline={false}
                                className="bg-white text-sm"
                                placeholder="Min amount: 0.01"
                                onChange={(e) => {
                                  onChange(e);
                                  setAmount(e.target.value);
                                }}
                                value={value ? value : ""}
                              />
                              {Number(tokenBalance) > 0 && (
                                <div
                                  role="button"
                                  onClick={setMax}
                                  className="flex gap-1 p-4"
                                >
                                  <p className="text-primary text-sm font-semibold">
                                    Max
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          name={"amount"}
                        />
                        {errors.amount && (
                          <ShowError error={`${errors.amount?.message}`} />
                        )}
                        {!Number.isNaN(tokenBalance) && (
                          <div className="flex gap-3 items-center text-primary">
                            <p className="text-sm font-semibold">
                              Available Balance:
                            </p>
                            <p className="text-sm font-semibold">
                              {tokenBalance
                                ? `${formatCur(tokenBalance, 10)}`
                                : "0.00"}{" "}
                              {selectedToken?.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between mt-5 items-center">
                      <div className="flex flex-col">
                        <p className="text-sm">Amount Recieved</p>
                        <div className="flex gap-1 items-center">
                          <p className="text-xl">{amount}</p>
                          <p className="text-xl">{selectedToken?.name}</p>
                        </div>
                      </div>
                      <div>
                        <Button
                          type={"submit"}
                          kind={"primary"}
                          onClick={handleSubmit(onSubmit)}
                          disabled={isSubmitting || isPending}
                        >
                          <div className="px-10 h-8 flex items-center justify-center">
                            <p>Deposit</p>
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

export default DepositModal;
