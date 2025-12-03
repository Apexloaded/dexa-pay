"use client";

import React from "react";
import Header from "@/components/ui/Header";
import { useAuth } from "@/context/auth.context";
import QuickAction from "@/components/Home/quick-actions/QuickAction";
import Section from "@/components/layouts/Section";
import Aside from "@/components/layouts/Aside";
import Container from "@/components/layouts/Container";
import ListBills from "@/components/Bills/ListBills";
import UserPFP from "@/components/ui/UserPFP";

function Funding() {
  const { user } = useAuth();
  return (
    <Container>
      <Section>
        <div className="flex h-full flex-col overflow-scroll scrollbar-hide">
          <div className="flex items-start pr-5 py-4 pl-2 z-50 bg-white justify-between sticky top-0">
            <Header title="Bills" isBack={true} />
            <div>
              <UserPFP name={user?.name} />
            </div>
          </div>
          <div>
            <ListBills />
          </div>
        </div>
      </Section>
      <Aside>
        <QuickAction showQuickPayBtn={true} />
      </Aside>
    </Container>
  );
}

export default Funding;
