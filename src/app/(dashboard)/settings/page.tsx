"use client";

import React, { useState } from "react";
import Container from "@/components/layouts/Container";
import Section from "@/components/layouts/Section";
import Header from "@/components/ui/Header";
import UserPFP from "@/components/ui/UserPFP";
import { useAuth } from "@/context/auth.context";
import TabsRoot from "@/components/Tabs/TabsRoot";
import TabsList from "@/components/Tabs/TabsList";
import TabsHeader from "@/components/Tabs/TabsHeader";
import TabsContent from "@/components/Tabs/TabsContent";
import ProfileTab from "@/components/Settings/ProfileTab";
import ContactTab from "@/components/Settings/ContactTab";
import SecurityTab from "@/components/Settings/SecurityTab";
import APIKeyTab from "@/components/Settings/APIKeyTab";

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("tab1");

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <Container>
      <Section>
        <div className="flex h-full flex-col overflow-scroll scrollbar-hide">
          <div className="flex items-center px-5 py-4 z-50 bg-white justify-between sticky top-0">
            <Header title="Settings" isBack={false} />
            <div className="flex items-center gap-x-2">
              <UserPFP name={user?.name} />
            </div>
          </div>
          <div className="flex-1 bg-light">
            <TabsRoot>
              <TabsList className="sticky top-[4.24rem] z-50 bg-white px-5 shadow-sm border-b border-light pb-1">
                <TabsHeader
                  className="text-left"
                  isActiveText={true}
                  title="Profile"
                  value="tab1"
                  activeTabId={activeTab}
                  onTabChange={onTabChange}
                  isCenter={false}
                />
                <TabsHeader
                  isActiveText={true}
                  title="Contact"
                  value="tab2"
                  activeTabId={activeTab}
                  onTabChange={onTabChange}
                  isCenter={false}
                />
                <TabsHeader
                  isActiveText={true}
                  title="Security"
                  value="tab3"
                  activeTabId={activeTab}
                  onTabChange={onTabChange}
                  isCenter={false}
                />
                <TabsHeader
                  isActiveText={true}
                  title="API Key & Webhooks"
                  value="tab4"
                  activeTabId={activeTab}
                  onTabChange={onTabChange}
                  isCenter={false}
                />
              </TabsList>
              <TabsContent
                value="tab1"
                activeTabId={activeTab}
                className="bg-light"
              >
                <div className="flex">
                  <ProfileTab />
                </div>
              </TabsContent>
              <TabsContent value="tab2" activeTabId={activeTab}>
                <div className="flex">
                  <ContactTab />
                </div>
              </TabsContent>
              <TabsContent value="tab3" activeTabId={activeTab}>
                <div className="flex">
                  <SecurityTab />
                </div>
              </TabsContent>
              <TabsContent value="tab4" activeTabId={activeTab}>
                <div className="flex">
                  <APIKeyTab />
                </div>
              </TabsContent>
            </TabsRoot>
          </div>
        </div>
      </Section>
    </Container>
  );
}

export default Settings;
