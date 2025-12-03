"use client";

import React, { useState, useEffect } from "react";
import BillHeader from "@/components/Bills/BillHeader";
import Button from "@/components/Form/Button";
import { formatCur } from "@/libs/helpers";
import { BanknoteIcon } from "lucide-react";
import { useDexa } from "@/context/dexa.context";
import { Bills } from "@/interfaces/bills.interface";
import { useReadContract } from "wagmi";
import { useParams } from "next/navigation";
import { mapBill } from "@/components/Bills/ListBills";
import { billStatusProps } from "@/components/Bills/Table/BillTableBody";
import { Tokens } from "@/libs/tokens";
import { Token } from "@/interfaces/transaction.interface";
import Moment from "react-moment";
import BillTabs from "@/components/Bills/Explore/BillTabs";
import FundBillModal from "@/components/Bills/Explore/FundBillModal";
import { useAppSelector } from "@/hooks/redux.hook";
import { selectConnector } from "@/slices/account/auth.slice";
import WalletConnectModal from "@/components/Auth/WalletConnectModal";

function BillDetails() {
  const { id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [bill, setBill] = useState<Bills>();
  const [token, setToken] = useState<Token>();
  const { FundingAbi, FundingAddr } = useDexa();
  const { isConnected } = useAppSelector(selectConnector);
  const [connectModal, setConnectModal] = useState<boolean>(false);
  const { data, isLoading } = useReadContract({
    abi: FundingAbi,
    address: FundingAddr,
    functionName: "getBill",
    args: [id],
  });

  useEffect(() => {
    if (data) {
      const mappedBill = mapBill(data as Bills);
      const token = Tokens.find((t) => t.address == mappedBill.billToken);
      setToken(token);
      setBill(mappedBill);
    }
  }, [data]);

  return (
    <div className="bg-light h-svh overflow-scroll">
      <BillHeader />
      {connectModal && <WalletConnectModal setModal={setConnectModal} />}
      {bill && !isLoading && (
        <>
          <div className="max-w-7xl mx-auto px-5">
            <div className="border-b border-medium/20 pb-3 mt-10 flex justify-between items-center">
              <div className="">
                <div className="flex items-center space-x-2">
                  <BanknoteIcon size={20} />
                  <p className="text-xs uppercase">BILL BALANCE</p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-black">
                    {formatCur(`${bill?.realisedAmount}`)}
                  </p>
                  <p className="text-2xl">{token?.symbol}</p>
                  <div>
                    <p
                      className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${
                        billStatusProps[bill.status].class
                      }`}
                    >
                      {billStatusProps[bill.status].text}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  kind="primary"
                  onClick={() => {
                    if (!isConnected) {
                      setConnectModal(true);
                      return;
                    }
                    setIsOpen(true);
                  }}
                >
                  Fund Bill
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              <div className="bg-white rounded-xl shadow-lg px-5 py-4 border-medium/20 border">
                <p className="text-dark font-bold">Overview</p>
                <div className="mt-3">
                  <p className="uppercase text-medium text-sm">Bill balance</p>
                  <p className="text-sm flex items-center gap-x-2">
                    <span>
                      {formatCur(bill.realisedAmount)} {token?.symbol}
                    </span>
                    {token && <token.icon height="20" width="20" />}
                  </p>
                </div>
                <div className="mt-3">
                  <p className="uppercase text-medium text-sm">Participants</p>
                  <p className="text-sm">{bill.participants.length} Users</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg px-5 py-4 border-medium/20 border">
                <p className="text-dark font-bold">More Info</p>
                <div className="mt-3">
                  <p className="uppercase text-medium text-sm">Creator</p>
                  <p className="text-sm truncate text-info">{bill.creator}</p>
                </div>
                <div className="mt-3">
                  <p className="uppercase text-medium text-sm">BILL TOKEN</p>
                  <p className="text-sm truncate text-info">{bill.billToken}</p>
                </div>
              </div>
              <div className="bg-white sm:col-span-2 lg:col-span-1 rounded-xl shadow-lg px-5 py-4 border-medium/20 border">
                <p className="text-dark font-bold">Details</p>
                <div className="mt-3">
                  <p className="uppercase text-medium text-sm">Created At</p>
                  <p className="text-sm text-dark">
                    <Moment>{bill.createdAt}</Moment>
                  </p>
                </div>
                <div className="mt-3">
                  <p className="uppercase text-medium text-sm">ID</p>
                  <p className="text-sm truncate text-dark">{bill.billId}</p>
                </div>
              </div>
            </div>
            <div className="pt-8 pb-20">
              <BillTabs bill={bill} />
            </div>
          </div>
          <FundBillModal bill={bill} isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
      )}
    </div>
  );
}

export default BillDetails;
