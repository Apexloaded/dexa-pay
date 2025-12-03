"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/Form/Button";
import { useDexa } from "@/context/dexa.context";
import {
  BillStatus,
  Bills,
  ParticipantType,
} from "@/interfaces/bills.interface";
import { ITransaction } from "@/interfaces/transaction.interface";
import { formatCur, formatWalletAddress } from "@/libs/helpers";
import { Tokens } from "@/libs/tokens";
import { ArrowBigDown, ChevronDown, CopyIcon, ShareIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Moment from "react-moment";
import { useReadContract } from "wagmi";

interface Props {
  bill: Bills;
}

export const billStatusProps = {
  [BillStatus.Active]: {
    class: "bg-primary/40 text-primary",
    text: "Active",
  },
  [BillStatus.Completed]: {
    class: "bg-success/40 text-white",
    text: "Completed",
  },
};

const participantProps = {
  [ParticipantType.Single]: {
    text: "Single",
  },
  [ParticipantType.Multiple]: {
    text: "Multiple",
  },
};
function BillTableBody({ bill }: Props) {
  const token = Tokens.find((t) => t.address == bill.billToken);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { FundingAddr, FundingAbi } = useDexa();
  const [tnxs, setTnxs] = useState<ITransaction[]>([]);
  const { data } = useReadContract({
    abi: FundingAbi,
    address: FundingAddr,
    functionName: "getBillTransactions",
    args: [bill.billId],
  });

  useEffect(() => {
    if (data) {
      setTnxs(data as ITransaction[]);
    }
  }, [data]);

  return (
    <>
      <tr
        role="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 border-b border-light rounded-lg last-of-type:border-none cursor-pointer hover:bg-primary/20 ${
          isOpen && "bg-primary/20"
        }`}
      >
        <td className="px-4">
          <div className="flex items-center gap-x-2">
            <div className="w-7">
              {token && <token.icon height="25" width="25" />}
            </div>

            <div className="flex-1">
              <p className="text-sm text-left font-bold flex items-center gap-x-2">
                <span>{formatWalletAddress(bill.billId)}</span>
                <CopyIcon size={15} />
              </p>
              <p className="text-medium text-sm">
                Bal: {formatCur(bill.realisedAmount)} {token?.symbol}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4">
          <p
            className={`text-sm text-left inline-block rounded-xl px-2 py-[0.1rem] ${
              billStatusProps[bill.status].class
            }`}
          >
            {billStatusProps[bill.status].text}
          </p>
        </td>
        <td className="px-4">
          <p className="text-sm text-left">
            {formatWalletAddress(bill.billToken)}
          </p>
        </td>
        <td className="px-4">
          <p className="text-sm text-left">{tnxs.length || 0}</p>
        </td>
        <td className="px-4">
          <p className="text-sm text-left text-nowrap">
            <Moment fromNow>{bill.createdAt}</Moment>
          </p>
        </td>
        <td className="px-4">
          <div className="flex items-center justify-end gap-x-5">
            <Button kind="default" shape="CIRCLE" onClick={(e) => e.stopPropagation()}>
              <ShareIcon size={18} />
            </Button>
            <p className="text-sm rounded-sm float-end bg-primary/40 w-7 h-7 flex items-center justify-center">
              <ChevronDown
                className={`text-white duration-200 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </p>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-light">
          <td colSpan={6}>
            <div className="px-5 py-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-medium">Bill ID</p>
                  <p className="text-dark font-semibold">{bill.billId}</p>
                  <Link
                    href={bill.billUrl}
                    target="_blank"
                    className="text-primary font-semibold"
                  >
                    View in explorer
                  </Link>
                </div>
                <p
                  className={`text-sm text-left inline-block rounded-xl px-2 py-[0.1rem] ${
                    billStatusProps[bill.status].class
                  }`}
                >
                  Bill {billStatusProps[bill.status].text}
                </p>
              </div>

              <div className="flex items-center justify-between mt-8">
                <div>
                  <p className="text-medium">BID</p>
                  <p className="text-dark">
                    {bill.id}
                  </p>
                </div>

                {bill.isFixedAmount && (
                  <div>
                    <p className="text-medium">Bill Amount</p>
                    <p>{bill.amount}</p>
                  </div>
                )}

                <div>
                  <p className="text-medium">Amount Realized</p>
                  <p className="text-dark font-bold">
                    {bill.realisedAmount} {token?.symbol}
                  </p>
                </div>

                <div>
                  <p className="text-medium">Participants</p>
                  <p className="text-dark">
                    {participantProps[bill.participantType].text}{" "}
                    {bill.participants.length}
                  </p>
                </div>

                <div>
                  <p className="text-medium">Recipient</p>
                  <p className="text-dark">{bill.recipient}</p>
                </div>
              </div>
              {/* <p className="capitalize font-semibold">{bill.title}</p>
              <p className="text-medium font-light">{bill.description}</p> */}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default BillTableBody;
