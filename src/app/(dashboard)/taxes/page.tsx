"use client";

import { useState } from "react";
import Dashboard from "@/components/Home/Dashboard";
import QuickAction from "@/components/Home/quick-actions/QuickAction";
import TxCount from "@/components/Transactions/TxCount";
import Aside from "@/components/layouts/Aside";
import Container from "@/components/layouts/Container";
import Section from "@/components/layouts/Section";
import Header from "@/components/ui/Header";
import UserPFP from "@/components/ui/UserPFP";
import { useAuth } from "@/context/auth.context";
import ListGroups from "@/components/Taxes/ListGroups";

export default function Taxes() {
  const { user } = useAuth();

  return (
    <Container>
      <Section>
        <div className="flex h-full flex-col overflow-scroll scrollbar-hide">
          <div className="flex items-center pr-5 py-4 pl-2 z-50 bg-white justify-between sticky top-0">
            <Header title="Taxes" isBack={true} />
            <div className="flex items-center gap-x-2">
              <TxCount />
              <UserPFP name={user?.name} />
            </div>
          </div>
          <div className="px-5">
            <ListGroups />
          </div>
        </div>
      </Section>
      <Aside>
        <QuickAction />
      </Aside>
    </Container>
  );
}
