"use client";

import React, { Fragment, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Label from "../Form/Label";
import Input from "../Form/Input";
import TabsRoot from "../Tabs/TabsRoot";
import TabsList from "../Tabs/TabsList";
import TabsHeader from "../Tabs/TabsHeader";
import TabsContent from "../Tabs/TabsContent";
import Button from "../Form/Button";
import { ClipboardPenLineIcon, User2Icon, XIcon } from "lucide-react";
import Select, { Options } from "../Form/Select";
import { Tokens } from "@/libs/tokens";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { useAccount, useReadContract } from "wagmi";
import { useDexa } from "@/context/dexa.context";
import { UserBalance, UserInterface } from "@/interfaces/user.interface";
import {
  formatWalletAddress,
  isLikelyUsername,
  walletToLowercase,
  weiToUnit,
} from "@/libs/helpers";
import ShowError from "../Form/ShowError";
import useClipBoard from "@/hooks/clipboard.hook";
import { isAddress } from "ethers";
import debounce from "debounce";
import useTransfer from "@/hooks/transactions/transfer.hook";

type Props = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

function TransferModal({ isOpen, setIsOpen }: Props) {
  const {
    trigger,
    watch,
    control,
    setValue,
    reset,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm();
  const username = watch("username");
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<string>("tab1");
  const [receiver, setReceiver] = useState<UserInterface>();
  const { paste } = useClipBoard();
  const [amount, setAmount] = useState<string>("0.00");
  const [resetKey, setResetKey] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<Options>();
  const [tokenBalance, setTokenBalance] = useState<UserBalance>();
  const { GatewayAddr, GatewayAbi } = useDexa();
  const { onSubmit: initOnSubmit, isPending } = useTransfer();
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

  const { refetch: findUserByUsername, isFetching: isFetchingUser } =
    useReadContract({
      abi: GatewayAbi,
      address: GatewayAddr,
      functionName: "getUserByName",
      args: [username],
      query: { enabled: false },
    });

  const search = useCallback(
    debounce(async (query) => {
      if (query) {
        if (isLikelyUsername(query)) {
          const userRes = await findUserByUsername();
          setReceiver(userRes.data as UserInterface);
          const isAvailable = !!userRes.data;
          if (isAvailable) {
            clearErrors("username");
          }
          return !!userRes;
        }
      }
    }, 1000),
    []
  );

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

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

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
    const { to, token, amount, remark } = payload;
    const receiverAddress = activeTab == "tab1" ? to : receiver?.wallet;
    await initOnSubmit({
      token,
      amount,
      to: receiverAddress,
      remark,
      resetForm,
      closeModal,
      username: `${receiver?.name}`,
      tokenName: `${tokenBalance?.symbol}`,
    });
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
            <DialogPanel className="inline-block w-full max-w-xl max-h-svh md:max-h-[45rem] md:pb-10 md:my-8 overflow-scroll scrollbar-hide text-left align-middle transition-all transform bg-white md:shadow-2xl rounded-2xl">
              <DialogTitle
                as="h3"
                className="text-lg px-4 py-2 flex top-0 sticky z-20 bg-white border-b border-light justify-between items-center leading-6 m-0 text-dark/80"
              >
                <div className="flex items-center gap-x-2">
                  <span className="font-bold">Dexa Pay</span>
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
              <div className="flex flex-col gap-5 md:gap-8 px-5 pt-2 ">
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
                      rules={{
                        required: "Choose a token",
                      }}
                    />
                    {errors.token && (
                      <ShowError error={`${errors.token?.message}`} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                  <div className="flex-1">
                    <TabsRoot>
                      <TabsList className="border-b border-medium/60">
                        <TabsHeader
                          isActiveBg={false}
                          isActiveText={true}
                          title="Pay ID"
                          value="tab1"
                          activeTabId={activeTab}
                          onTabChange={onTabChange}
                          isCenter={false}
                        />
                        <TabsHeader
                          isActiveBg={false}
                          isActiveText={true}
                          title="Username"
                          value="tab2"
                          activeTabId={activeTab}
                          onTabChange={onTabChange}
                          isCenter={false}
                        />
                      </TabsList>
                      <TabsContent value="tab1" activeTabId={activeTab}>
                        <div className="flex flex-col gap-5">
                          {activeTab == "tab1" && (
                            <div className="flex-1 mt-6">
                              <Label
                                title="Dexa Pay ID"
                                isMargin={true}
                                isRequired={true}
                              />
                              <Controller
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                  <div className="flex items-center relative bg-white overflow-hidden border border-medium/60 rounded-md">
                                    <Input
                                      type={"search"}
                                      isOutline={false}
                                      className="bg-white text-sm"
                                      placeholder="0x719c1A5dac69C4C6b462Aa7E8Fb9bc90Ec9128b9"
                                      onChange={onChange}
                                      value={value ? value : ""}
                                    />
                                    <div
                                      role="button"
                                      onClick={onPaste}
                                      className="p-4"
                                    >
                                      <ClipboardPenLineIcon
                                        className="text-primary"
                                        size={20}
                                      />
                                    </div>
                                  </div>
                                )}
                                rules={{
                                  required: "Enter a withdrawal address",
                                  validate: (value) =>
                                    isAddress(value) ||
                                    "Wallet address is not valid",
                                }}
                                name={"to"}
                              />
                              {errors.to && (
                                <ShowError error={`${errors.to?.message}`} />
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="tab2" activeTabId={activeTab}>
                        <div className="flex flex-col gap-5">
                          {activeTab == "tab2" && (
                            <div className="flex-1 mt-6">
                              <Label
                                title="Dexa Username"
                                isMargin={true}
                                isRequired={true}
                              />
                              <Controller
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                  <div className="flex items-center relative bg-white border border-medium/60 rounded-md">
                                    <div
                                      role="button"
                                      onClick={onPaste}
                                      className="p-4 border-r border-primary"
                                    >
                                      <User2Icon
                                        className="text-primary"
                                        size={20}
                                      />
                                    </div>
                                    <Input
                                      type={"search"}
                                      isOutline={false}
                                      className="bg-white text-sm"
                                      placeholder="Dexa username"
                                      onChange={(e) => {
                                        onChange(e);
                                        search(e.target.value);
                                        setReceiver(undefined);
                                      }}
                                      value={value ? value : ""}
                                    />
                                    <div
                                      role="button"
                                      onClick={onPaste}
                                      className="p-4"
                                    >
                                      <ClipboardPenLineIcon
                                        className="text-primary"
                                        size={20}
                                      />
                                    </div>
                                  </div>
                                )}
                                name={"username"}
                                rules={{
                                  required: "Enter a username",
                                  validate: (value) =>
                                    receiver?.username == value ||
                                    "Enter a valid username",
                                }}
                              />
                              {errors.username && (
                                <ShowError
                                  error={`${errors.username?.message}`}
                                />
                              )}
                              {isLikelyUsername(username) && (
                                <div className="flex gap-3 items-center text-primary">
                                  <p className="text-sm font-semibold">
                                    {isFetchingUser
                                      ? "Searching..."
                                      : receiver &&
                                        receiver?.username == username
                                      ? `${
                                          receiver.name
                                        } (${formatWalletAddress(
                                          `${receiver.wallet}`
                                        )})`
                                      : "No user found"}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </TabsRoot>
                    <div className="flex flex-col gap-5 pt-5">
                      <div className="flex-1">
                        <Label
                          title="Amount"
                          isMargin={true}
                          isRequired={true}
                        />
                        <Controller
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <div className="flex items-center relative overflow-hidden bg-white border border-medium/60 rounded-md">
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
                              <Label title="Remark" isMargin={true} />
                              <Input
                                className="bg-white border border-medium/60 rounded-md text-sm"
                                placeholder="Remarks"
                                value={value}
                                onChange={onChange}
                              />
                            </>
                          )}
                          name={"remark"}
                          defaultValue={""}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-10 items-center">
                      <div className="flex flex-col">
                        <p className="text-sm">Amount Recieved</p>
                        <div className="flex gap-1 items-center">
                          <p className="text-xl">{amount}</p>
                          <p className="text-xl">{selectedToken?.name}</p>
                        </div>
                        <p className="text-xs text-medium">
                          Fee: 1.00 {selectedToken?.name}
                        </p>
                      </div>
                      <div>
                        <Button
                          type={"submit"}
                          kind={"primary"}
                          onClick={handleSubmit(onSubmit)}
                          disabled={isSubmitting || isPending}
                        >
                          <div className="px-10 h-8 flex items-center justify-center">
                            <p>Transfer</p>
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

export default TransferModal;
