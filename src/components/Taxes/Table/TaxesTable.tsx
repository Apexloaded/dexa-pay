import React, { useState } from "react";
import BillTableBody from "./TaxesTableBody";
import { Bills } from "@/interfaces/bills.interface";
import EmptyBox from "@/components/ui/EmptyBox";

type Props = {
  bills: Bills[];
};
export default function TaxesTable({ bills }: Props) {
  return (
    <div className="flex-1 max-w-full overflow-auto border border-light rounded-lg">
      <table className="table-auto w-full border-collapse separate border-spacing-y-4">
        <thead className="border-b border-light px-4">
          <tr className="h-14 text-left font-bold">
            <th className="px-4 text-medium text-sm text-left w-32">Bill</th>
            <th className="px-4 text-medium text-sm w-24">Status</th>
            <th className="px-4 text-medium text-sm w-24">Token</th>
            <th className="px-4 text-medium text-sm w-16">Txn(s)</th>
            <th className="px-4 text-medium text-sm w-24 text-nowrap">Age</th>
            <th className="px-4 text-medium text-sm w-24"></th>
          </tr>
        </thead>
        <tbody>
          {bills.length > 0 ? (
            <>
              {bills.map((bill) => (
                <BillTableBody key={bill.billId} bill={bill} />
              ))}
            </>
          ) : (
            <tr>
              <td colSpan={6} className="pb-24">
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
