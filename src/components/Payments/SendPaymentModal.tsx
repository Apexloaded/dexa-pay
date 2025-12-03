"use client";

import React, { Fragment, useState, useEffect, useMemo } from "react";
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
import { ClipboardPenLineIcon, InfoIcon, XIcon } from "lucide-react";
import Select, { Options } from "../Form/Select";
import { Tokens } from "@/libs/tokens";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useWriteContracts, useCapabilities } from "wagmi/experimental";
import { useDexa } from "@/context/dexa.context";
import { UserBalance } from "@/interfaces/user.interface";
import { walletToLowercase, weiToUnit } from "@/libs/helpers";
import ShowError from "../Form/ShowError";
import useClipBoard from "@/hooks/clipboard.hook";
import useToast from "@/hooks/toast.hook";
import { parseEther, hexlify, toUtf8Bytes } from "ethers";
import TextArea from "../Form/TextArea";
import { sendPayWithEmail } from "@/actions/request.action";
import { useAuth } from "@/context/auth.context";
import { isWalletACoinbaseSmartWallet } from "@coinbase/onchainkit/wallet";
import useDexaCapabilities from "@/hooks/capabilities.hook";
import useSocket from "@/hooks/socket.hook";
import { SocketEvents } from "@/libs/enums";
import { SendPaymentEvent } from "@/interfaces/pay-request.interface";

type Props = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

function SendPaymentModal({ isOpen, setIsOpen }: Props) {
  const {
    trigger,
    watch,
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { address, chainId } = useAccount();
  const { paste } = useClipBoard();
  const { error, loading, success } = useToast();
  const { user, isSmartWallet } = useAuth();
  const { emit } = useSocket();
  const [amount, setAmount] = useState<string>("0.00");
  const [resetKey, setResetKey] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<Options>();
  const [tokenBalance, setTokenBalance] = useState<UserBalance>();
  const { GatewayAddr, GatewayAbi } = useDexa();
  const capabilities = useDexaCapabilities({ address, chainId, isSmartWallet });
  const { data: callID, writeContractsAsync, isPending } = useWriteContracts();
  const { writeContractAsync } = useWriteContract();
  const [options] = useState(
    Tokens.map((t) => {
      return { value: t.address, name: t.symbol, icon: t.icon };
    })
  );

  const { data } = useReadContract({
    abi: GatewayAbi,
    address: GatewayAddr,
    functionName: "getBalances",
    args: [`${address}`],
  });

  useEffect(() => {
    const init = () => {
      if (!data) return;
      const userBal = (data as UserBalance[]).map((balance: UserBalance) => {
        const token = Tokens.find(
          (t) =>
            walletToLowercase(t.address) ===
            walletToLowercase(balance.tokenAddress)
        );
        return { ...balance, ...(token || {}) };
      });
      const token = userBal.find((b) => b.address == selectedToken?.value);
      setTokenBalance(token);
    };
    init();
  }, [data, selectedToken]);

  const setMax = () => {
    if (!tokenBalance) return;
    const amount = weiToUnit(`${tokenBalance?.balance}`);
    setValue("amount", amount);
    setAmount(`${amount}`);
    trigger("amount");
  };

  const onPaste = async () => {
    const text = await paste();
    if (!text) return;
    setValue("to", text);
    trigger("to");
  };

  const onSubmit = async (payload: FieldValues) => {
    try {
      const { to, token, amount, remark } = payload;
      loading({
        msg: "Initiating transfer",
      });
      const paymentReq = await sendPayWithEmail({
        email: to,
        senderName: user?.name || "",
        tokenAddress: token,
        tokenName: tokenBalance?.name || "",
        amount,
        tokenSymbol: tokenBalance?.symbol || "",
        from: `${address}`,
      });
      const payId = hexlify(toUtf8Bytes(paymentReq.data.paymentId));
      const email = hexlify(toUtf8Bytes(paymentReq.data.email));
      const contractProps: any = {
        abi: GatewayAbi,
        address: GatewayAddr,
        functionName: "payByEmail",
        args: [parseEther(`${amount}`), email, remark, token, payId],
      };
      if (isSmartWallet) {
        await writeContractsAsync(
          {
            contracts: [{ ...contractProps }],
            capabilities,
          },
          {
            onSuccess: async (data) => {
              emit<SendPaymentEvent>(SocketEvents.PaymentSent, {
                email,
                paymentCode: payId,
              });
              success({
                msg: `${amount} ${tokenBalance?.symbol} sent`,
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
              emit<SendPaymentEvent>(SocketEvents.PaymentSent, {
                email,
                paymentCode: payId,
              });
              success({
                msg: `${amount} ${tokenBalance?.symbol} sent`,
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
      console.log(err);
      if (err instanceof Error) {
        error({ msg: err.message });
      }
      if (err && typeof err === "object") {
        error({ msg: JSON.stringify(err) });
      }
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const resetForm = () => {
    setAmount("0.00");
    reset();
    setResetKey((prevKey) => prevKey + 1);
    setTokenBalance(undefined);
    setSelectedToken(undefined);
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

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="inline-block w-full max-w-xl max-h-svh md:max-h-[45rem] pb-5 md:pb-10 md:my-8 overflow-scroll scrollbar-hide text-left align-middle transition-all transform bg-white md:shadow-2xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg px-4 py-2 flex top-0 sticky z-20 bg-white border-b border-light justify-between items-center leading-6 m-0 text-dark/80"
              >
                <div className="flex items-center gap-x-2">
                  <span className="font-bold">Send Payment</span>
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
                <div className="flex items-center gap-x-1">
                  <InfoIcon size={16} className="text-info" />
                  <p className="text-info font-thin">
                    You can send crypto through email address
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:gap-6">
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
                      rules={{
                        required: "Choose a token",
                      }}
                    />
                    {errors.token && (
                      <ShowError error={`${errors.token?.message}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label
                      title="Email address"
                      isMargin={true}
                      isRequired={true}
                    />
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <div className="flex items-center relative bg-white border border-medium/60 rounded-md overflow-hidden">
                          <Input
                            type={"email"}
                            isOutline={false}
                            className="bg-white text-sm"
                            placeholder="email@example.com"
                            onChange={onChange}
                            value={value ? value : ""}
                          />
                          <div role="button" onClick={onPaste} className="p-4">
                            <ClipboardPenLineIcon
                              className="text-primary"
                              size={20}
                            />
                          </div>
                        </div>
                      )}
                      rules={{
                        required: "Enter an email address",
                        pattern: {
                          value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,
                          message: "Email address is not valid",
                        },
                      }}
                      name={"to"}
                    />
                    {errors.to && <ShowError error={`${errors.to?.message}`} />}
                  </div>
                  <div className="flex-1">
                    <Label title="Amount" isMargin={true} isRequired={true} />
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <div className="flex items-center relative bg-white border border-medium/60 rounded-md overflow-hidden">
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
                          {Number(tokenBalance?.balance) > 0 && (
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
                      rules={{
                        required: "Enter withdrawal amount",
                        min: 0,
                        validate: (value) =>
                          parseFloat(value) > 0 || "Enter a valid amount",
                      }}
                    />
                    {errors.amount && (
                      <ShowError error={`${errors.amount?.message}`} />
                    )}
                    {tokenBalance && (
                      <div className="flex gap-3 items-center text-primary">
                        <p className="text-sm font-semibold">
                          Available Balance:
                        </p>
                        <p className="text-sm font-semibold">
                          {tokenBalance
                            ? `${weiToUnit(tokenBalance.balance)}`
                            : "0.00"}{" "}
                          {selectedToken?.name}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <>
                          <Label title="Message" isMargin={true} />
                          <TextArea
                            className="bg-white border border-medium/60 rounded-md py-2 text-sm"
                            placeholder="Send a message along with the payment."
                            value={value}
                            onChange={onChange}
                            rows={4}
                          />
                        </>
                      )}
                      name={"remark"}
                      defaultValue={""}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mt-6 items-center">
                      <div className="flex flex-col">
                        <p className="text-sm">Amount Sent</p>
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
                          <div className="px-3 h-8 flex items-center justify-center">
                            <p>{`Send Pay`}</p>
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

export default SendPaymentModal;
