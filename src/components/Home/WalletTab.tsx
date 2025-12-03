"use client";

import React, { useState, useEffect, SetStateAction } from "react";
import Button from "@/components/Form/Button";
import Radio from "@/components/Form/Radio";
import WalletSearch from "@/components/Wallet/WalletSearch";
import Header from "@/components/ui/Header";
import TabsRoot from "@/components/Tabs/TabsRoot";
import TabsList from "@/components/Tabs/TabsList";
import TabsHeader from "@/components/Tabs/TabsHeader";
import TabsContent from "@/components/Tabs/TabsContent";
import AssetsTable from "@/components/Wallet/AssetsTable";
import { useConverter } from "@/context/currency.context";
import { useDexa } from "@/context/dexa.context";
import { useAuth } from "@/context/auth.context";
import { useAccount, useReadContract } from "wagmi";
import { formatCur, walletToLowercase, weiToUnit } from "@/libs/helpers";
import { UserBalance } from "@/interfaces/user.interface";
import { useAppSelector, useAppDispatch } from "@/hooks/redux.hook";
import {
  selectHideBalance,
  setHideBalance,
} from "@/slices/account/hide-balance.slice";
import useStorage from "@/hooks/storage.hook";
import { StorageTypes } from "@/libs/enums";
import ListTransactions from "@/components/Wallet/ListTransactions";
import QuickAction from "@/components/Home/quick-actions/QuickAction";
import TransferModal from "@/components/Wallet/TransferModal";

import { CircleCheck, XIcon } from "lucide-react";
import { Tokens } from "@/libs/tokens";
import { useQuery } from "@tanstack/react-query";
import { fetchTxCount } from "@/actions/transaction.action";
import {
  setDepositModal,
  setWithdrawModal,
} from "@/slices/modals/modals.slice";

function WalletTab() {
  const isHidden = useAppSelector(selectHideBalance);
  const dispatch = useAppDispatch();
  const { address } = useAccount();
  const [isNotify, setIsNotify] = useState<boolean>(false);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [totalValue, setTotalValue] = useState<UserBalance>();
  const [activeTab, setActiveTab] = useState("tab1");
  const [isTransferModal, setIsTransferModal] = useState<boolean>(false);
  const [txCount, setTxCount] = useState<number>(0);
  const { setItem } = useStorage();
  const { usdRate, ethRate } = useConverter();
  const { GatewayAddr, GatewayAbi } = useDexa();
  const { user, isSmartWallet } = useAuth();
  const { data: txCountResponse } = useQuery({
    queryFn: () => fetchTxCount(),
    queryKey: ["tx-count"],
  });

  const { data } = useReadContract({
    abi: GatewayAbi,
    address: GatewayAddr,
    functionName: "getBalances",
    args: [`${user?.wallet}`],
  });

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    if (txCountResponse?.status == true) {
      setTxCount(txCountResponse.data);
      if (txCountResponse.data > 0) {
        setIsNotify(true);
      }
    }
  }, [txCountResponse]);

  useEffect(() => {
    const init = async () => {
      if (!data) return;
      const userBal = (data as UserBalance[])
        .map((balance: UserBalance) => {
          const token = Tokens.find(
            (t) =>
              walletToLowercase(t.address) ===
              walletToLowercase(balance.tokenAddress)
          );
          const amt =
            Number(balance.balance) > 0 ? weiToUnit(balance.balance) : "0";
          const usdEqv =
            Object.keys(usdRate).length > 0
              ? usdRate[`${token?.id}`] * Number(amt)
              : undefined;
          return { ...balance, usdValue: usdEqv, ...(token || {}) };
        })
        .sort((a, b) => Number(b.usdValue) - Number(a.usdValue));
      if (Object.keys(ethRate).length > 0 && Object.keys(usdRate).length > 0) {
        const convertedTotal = userBal.reduce((acc, token) => {
          const amt = Number(token.balance) > 0 ? weiToUnit(token.balance) : 0;
          return acc + amt * (ethRate[`${token.id}`] || 0);
        }, 0);
        const usdEquiv = usdRate["ethereum"] * convertedTotal;
        const ethToken = Tokens.find((t) => t.id == "ethereum");
        const payload: UserBalance = {
          ...ethToken,
          balance: `${convertedTotal}`,
          tokenAddress: "",
          usdValue: usdEquiv,
        };
        setTotalValue(payload);
      }
      setBalances(userBal);
    };
    init();
  }, [data, usdRate, ethRate, user?.wallet]);

  const toggleHide = () => {
    const value = !isHidden;
    setItem(StorageTypes.DEXA_HIDE_BAL, value);
    dispatch(setHideBalance(value));
  };

  return (
    <>
      <div className="flex h-full flex-1 flex-col overflow-scroll scrollbar-hide">
        {isNotify && txCount > 0 && isSmartWallet && (
          <div className="bg-primary/30 px-5 w-full sticky top-0">
            <div className="py-2 flex items-center justify-between w-full">
              <div className="flex items-center gap-x-1">
                <CircleCheck className="text-primary" size={20} />
                <p className="text-primary text-sm">
                  You have {txCount} free transfers
                </p>
              </div>
              <XIcon
                onClick={() => setIsNotify(false)}
                className="translate-x-1 text-medium cursor-pointer hover:text-dark"
                size={20}
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="px-5">
            <p className="text-sm">Total Balance</p>
            <div className="flex items-end">
              {totalValue?.balance ? (
                <div className="flex items-end">
                  {isHidden ? (
                    <p className="font-semibold text-2xl -mb-1">*******</p>
                  ) : (
                    <p className="font-semibold text-2xl -mb-1">
                      {Number(totalValue.balance) > 0
                        ? formatCur(totalValue?.balance)
                        : "0.00"}
                    </p>
                  )}

                  <p className="text-xs text-medium pl-1 font-semibold">ETH</p>
                </div>
              ) : (
                <div className="flex items-end">
                  {isHidden ? (
                    <p className="font-semibold text-2xl -mb-1">*******</p>
                  ) : (
                    <p className="font-semibold text-2xl -mb-1">0.00</p>
                  )}

                  <p className="text-xs text-medium pl-1 font-semibold">ETH</p>
                </div>
              )}

              {Number(totalValue?.balance) > 0 ? (
                totalValue?.usdValue && (
                  <div className="flex items-end">
                    {isHidden ? (
                      <p className="text-xs text-medium pl-2 font-semibold">
                        ******
                      </p>
                    ) : (
                      <p className="text-xs text-medium pl-2 font-semibold">
                        = {formatCur(totalValue?.usdValue, 6)} USD
                      </p>
                    )}
                  </div>
                )
              ) : (
                <></>
              )}
            </div>
            <div className="flex items-center gap-x-5 pt-5">
              <Button
                type="button"
                kind="primary"
                shape="NORMAL"
                className="border border-primary"
                onClick={() => dispatch(setDepositModal(true))}
              >
                <p className="text-sm text-white">Deposit</p>
              </Button>
              <Button
                type="button"
                kind="clear"
                shape="NORMAL"
                className="bg-light hover:bg-medium/20 border border-light"
                onClick={() => dispatch(setWithdrawModal(true))}
              >
                <p className="text-sm">Withdraw</p>
              </Button>
              <Button
                type="button"
                kind="clear"
                shape="NORMAL"
                className="bg-light hover:bg-medium/20 border border-light"
                onClick={() => setIsTransferModal(true)}
              >
                <p className="text-sm">Pay</p>
              </Button>
            </div>
            <div className="flex items-center gap-x-5 pt-5 max-w-xl">
              <WalletSearch />
              <div className="flex items-center gap-x-2">
                <Radio
                  type="checkbox"
                  checked={isHidden}
                  onChange={toggleHide}
                />
                <p className="text-sm">Hide balance</p>
              </div>
            </div>
            <div className="pt-5 pb-20">
              <TabsRoot>
                <TabsList className="">
                  <TabsHeader
                    isActiveText={true}
                    title="My Assets"
                    value="tab1"
                    activeTabId={activeTab}
                    onTabChange={onTabChange}
                    isCenter={false}
                    //isActiveBg={true}
                  />
                  <TabsHeader
                    isActiveText={true}
                    title="Transactions"
                    value="tab2"
                    activeTabId={activeTab}
                    onTabChange={onTabChange}
                    isCenter={false}
                    //isActiveBg={true}
                  />
                </TabsList>
                <TabsContent value="tab1" activeTabId={activeTab}>
                  <div className="flex-1 mt-1">
                    <AssetsTable
                      balances={balances}
                      setTransferModal={setIsTransferModal}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="tab2" activeTabId={activeTab}>
                  <div className="flex-1 mt-1">
                    <ListTransactions />
                  </div>
                </TabsContent>
              </TabsRoot>
            </div>
          </div>
        </div>
      </div>

      <TransferModal setIsOpen={setIsTransferModal} isOpen={isTransferModal} />
    </>
  );
}

export default WalletTab;
