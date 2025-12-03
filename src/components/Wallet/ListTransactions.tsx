"use client";

import React, { useEffect, useState } from "react";
import { timestampToDate, toOxString } from "@/libs/helpers";
import EmptyBox from "../ui/EmptyBox";
import { useDexa } from "@/context/dexa.context";
import { useAuth } from "@/context/auth.context";
import { useReadContract } from "wagmi";
import { ITransaction } from "@/interfaces/transaction.interface";
import { Tokens } from "@/libs/tokens";
import TxBodyItems from "../Transactions/TxBodyItems";

function ListTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const { GatewayAddr, GatewayAbi } = useDexa();
  const { user } = useAuth();
  const { data } = useReadContract({
    abi: GatewayAbi,
    address: GatewayAddr,
    functionName: "getUserTransactions",
    account: toOxString(user?.wallet),
    query: {
      enabled: !!user?.wallet,
    },
  });

  useEffect(() => {
    if (data) {
      const txData = data as ITransaction[];
      const mappedTx = txData
        .sort((a, b) => {
          const dateA = timestampToDate(a.txDate).getTime();
          const dateB = timestampToDate(b.txDate).getTime();
          return dateB - dateA;
        })
        .map((tx) => {
          const { txDate, txId, coin, ...payload } = tx;
          const token = Tokens.find((t) => t.address == tx.tokenAddress);
          return {
            txId: Number(txId),
            txDate: timestampToDate(txDate).toISOString(),
            coin: token,
            ...payload,
          } as ITransaction;
        });
      setTransactions(mappedTx);
    }
  }, [data]);

  return (
    <div className="flex-1 max-w-full overflow-auto border border-light">
      <table className="table-auto w-full">
        <thead className="border-b border-light px-4">
          <tr className="h-14 text-left font-bold">
            <th className="px-4 text-medium text-sm w-14 text-center"></th>
            <th className="px-4 text-medium text-sm w-32">Type</th>
            <th className="px-4 text-medium text-sm">From</th>
            <th className="px-4 text-medium text-sm">To</th>
            <th className="px-4 text-medium text-sm w-24">Amount</th>
            <th className="px-4 text-medium text-sm w-20">Fee</th>
            <th className="px-4 text-medium text-sm w-32">Age</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            <>
              {transactions.map((tx, index) => (
                <TxBodyItems key={index} tx={tx} />
              ))}
            </>
          ) : (
            <tr>
              <td colSpan={7} className="pb-24">
                <EmptyBox
                  title="No Transaction"
                  message="You currently do not have any transaction"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ListTransactions;
