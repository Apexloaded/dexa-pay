"use client";

import React, { useEffect, useState } from "react";
import EstTotalValue from "./EstTotalValue";
import Button from "@/components/Form/Button";
import { PlusIcon } from "lucide-react";
import TabsRoot from "@/components/Tabs/TabsRoot";
import TabsList from "@/components/Tabs/TabsList";
import TabsHeader from "@/components/Tabs/TabsHeader";
import TabsContent from "@/components/Tabs/TabsContent";
import CreateBillModal from "./CreateBillModal";
import BillTable from "./Table/BillTable";
import { useDexa } from "@/context/dexa.context";
import { useAccount, useReadContract } from "wagmi";
import { BillStatus, Bills } from "@/interfaces/bills.interface";
import { timestampToDate, weiToUnit } from "@/libs/helpers";

const sortBillByDate = (req: Bills[]) => {
  return req
    .sort((a, b) => {
      const dateA = timestampToDate(a.createdAt).getTime();
      const dateB = timestampToDate(b.createdAt).getTime();
      return dateB - dateA;
    })
    .map((p: Bills) => mapBill(p));
};

export const mapBill = (bill: Bills) => {
  const { id, createdAt, amount, balance, realisedAmount, ...payload } = bill;
  return {
    id: Number(id).toString(),
    createdAt: timestampToDate(bill.createdAt).toISOString(),
    amount: weiToUnit(bill.amount),
    balance: weiToUnit(bill.balance),
    realisedAmount: weiToUnit(bill.realisedAmount),
    ...payload,
  } as Bills;
};

function ListBills() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [isOpen, setIsOpen] = useState(false);
  const [bills, setBills] = useState<Bills[]>([]);
  const [activeBills, setActiveBills] = useState<Bills[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [completedBills, setCompleteBills] = useState<Bills[]>([]);
  const { address } = useAccount();
  const { FundingAddr, FundingAbi } = useDexa();
  const { data } = useReadContract({
    abi: FundingAbi,
    address: FundingAddr,
    functionName: "getAllUsersBills",
    account: address,
  });

  useEffect(() => {
    if (data) {
      const sortedBills = sortBillByDate(data as Bills[]);
      console.log(sortedBills);
      const active = sortedBills.filter((b) => b.status == BillStatus.Active);
      const complete = sortedBills.filter(
        (b) => b.status == BillStatus.Completed
      );
      setTotalValue(sortedBills.reduce((acc, b) => acc + b.realisedAmount, 0));
      setActiveBills(active);
      setCompleteBills(complete);
      setBills(sortedBills);
    }
  }, [data]);

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="w-full flex-1">
      <div className="px-5 flex items-start justify-between">
        <EstTotalValue />
        <Button
          kind="primary"
          size="LARGE"
          className="h-[2.5rem]"
          onClick={() => setIsOpen(true)}
        >
          <p className="flex items-center gap-x-1 text-sm">
            <PlusIcon size={18} />
            <span>Create</span>
          </p>
        </Button>
      </div>
      <div className="pt-8 px-5 pb-20">
        <TabsRoot>
          <TabsList className="">
            <TabsHeader
              isActiveText={true}
              title="All Bills"
              value="tab1"
              activeTabId={activeTab}
              onTabChange={onTabChange}
              isCenter={false}
              //isActiveBg={true}
            />
            <TabsHeader
              isActiveText={true}
              title="Active"
              value="tab2"
              activeTabId={activeTab}
              onTabChange={onTabChange}
              isCenter={false}
              //isActiveBg={true}
            />
            <TabsHeader
              isActiveText={true}
              title="Completed"
              value="tab3"
              activeTabId={activeTab}
              onTabChange={onTabChange}
              isCenter={false}
              //isActiveBg={true}
            />
          </TabsList>
          <TabsContent value="tab1" activeTabId={activeTab}>
            <div className="flex-1 mt-1">
              <BillTable bills={bills} />
            </div>
          </TabsContent>
          <TabsContent value="tab2" activeTabId={activeTab}>
            <div className="flex-1 mt-1">
              <BillTable bills={activeBills} />
            </div>
          </TabsContent>
          <TabsContent value="tab3" activeTabId={activeTab}>
            <div className="flex-1 mt-1">
              <BillTable bills={completedBills} />
            </div>
          </TabsContent>
        </TabsRoot>
      </div>
      <CreateBillModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default ListBills;
