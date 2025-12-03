"use client";

import React, { useEffect, useState } from "react";
import { formatCur, timestampToDate, weiToUnit } from "@/libs/helpers";
import EmptyBox from "../../ui/EmptyBox";
import { useDexa } from "@/context/dexa.context";
import { useReadContract } from "wagmi";
import { Tokens } from "@/libs/tokens";
import { BillParticipants, Bills } from "@/interfaces/bills.interface";
import Button from "@/components/Form/Button";
import Moment from "react-moment";

type Props = {
  bill: Bills;
};
function ParticipantTab({ bill }: Props) {
  const token = Tokens.find((t) => t.address == bill.billToken);
  const [participants, setParticipants] = useState<BillParticipants[]>([]);
  const { FundingAddr, FundingAbi } = useDexa();
  const { data } = useReadContract({
    abi: FundingAbi,
    address: FundingAddr,
    functionName: "getBillParticipants",
    args: [bill.id],
  });

  useEffect(() => {
    if (data) {
      const txData = data as BillParticipants[];
      const mappedParticipants = txData
        .sort((a, b) => {
          const dateA = timestampToDate(a.updatedAt).getTime();
          const dateB = timestampToDate(b.updatedAt).getTime();
          return dateB - dateA;
        })
        .map((tx) => {
          const { updatedAt, count, amount, ...payload } = tx;
          return {
            count: Number(count),
            updatedAt: timestampToDate(updatedAt).toISOString(),
            amount: weiToUnit(amount),
            ...payload,
          } as BillParticipants;
        });
      setParticipants(mappedParticipants);
    }
  }, [data]);

  return (
    <div className="flex-1 max-w-full overflow-auto border border-medium/20 bg-white rounded-2xl">
      <table className="table-auto w-full">
        <thead className="border-b border-light px-4">
          <tr className="h-14 text-left font-bold">
            <th className="px-4 text-medium text-sm w-14 text-center"></th>
            <th className="px-4 text-medium text-sm">Address</th>
            <th className="px-4 text-medium text-sm">Amount</th>
            <th className="px-4 text-medium text-sm text-nowrap">
              Funding Count
            </th>
            <th className="px-4 text-medium text-sm">Last Funded</th>
          </tr>
        </thead>
        <tbody>
          {participants.length > 0 ? (
            <>
              {participants.map((p, index) => (
                <tr key={index} className="h-14 border-b border-light last-of-type:border-none">
                  <td className="px-4">
                    <p className="text-sm text-center">
                      {token && <token.icon />}
                    </p>
                  </td>
                  <td className="px-4">
                    <p className="text-sm text-left">{p.user}</p>
                  </td>
                  <td className="px-4">
                    <p className="text-sm text-left">
                      {formatCur(p.amount)} {token?.symbol}
                    </p>
                  </td>
                  <td className="px-4">
                    <p className="text-sm text-left">{p.count}</p>
                  </td>
                  <td className="px-4">
                    <p className="text-sm text-left">
                      <Moment>{p.updatedAt}</Moment>
                    </p>
                  </td>
                </tr>
              ))}
            </>
          ) : (
            <tr>
              <td colSpan={5} className="pb-24">
                <EmptyBox
                  title="No Participant"
                  message="No one have funded this bill yet, be the first."
                />
                <div className="flex justify-center mt-3">
                  <Button kind="primary">Fund Bill</Button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ParticipantTab;
