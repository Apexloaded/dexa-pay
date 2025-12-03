"use client";

import React, { useState } from "react";
import Button from "../Form/Button";
import { PlusIcon } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import TabsRoot from "../Tabs/TabsRoot";
import TabsList from "../Tabs/TabsList";
import TabsContent from "../Tabs/TabsContent";
import TabsHeader from "../Tabs/TabsHeader";
import BillTable from "../Bills/Table/BillTable";

function ListGroups() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  return (
    <div>
      <div className="mb-8 flex items-start justify-end">
        {/* <EstTotalValue /> */}
        <Button
          kind="primary"
          size="LARGE"
          className="h-[2.5rem]"
          onClick={() => setIsOpen(true)}
        >
          <p className="flex items-center gap-x-1 text-sm">
            <PlusIcon size={18} />
            <span>Create Group</span>
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
              {/* <BillTable bills={bills} /> */}
            </div>
          </TabsContent>
          <TabsContent value="tab2" activeTabId={activeTab}>
            <div className="flex-1 mt-1">
              {/* <BillTable bills={activeBills} /> */}
            </div>
          </TabsContent>
          <TabsContent value="tab3" activeTabId={activeTab}>
            <div className="flex-1 mt-1">
              {/* <BillTable bills={completedBills} /> */}
            </div>
          </TabsContent>
        </TabsRoot>
      </div>
      <CreateGroupModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default ListGroups;
