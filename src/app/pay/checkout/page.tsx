"use client";

import React, { useState } from "react";
import Image from "next/image";
import { favicon } from "@/components/Icons/Connector";
import { CopyIcon, InfoIcon, XIcon } from "lucide-react";
import TabsRoot from "@/components/Tabs/TabsRoot";
import TabsList from "@/components/Tabs/TabsList";
import TabsHeader from "@/components/Tabs/TabsHeader";
import TabsContent from "@/components/Tabs/TabsContent";
import Button from "@/components/Form/Button";
import Link from "next/link";
import { QRCode } from "react-qrcode-logo";
import Label from "@/components/Form/Label";
import useClipBoard from "@/hooks/clipboard.hook";

function Checkout() {
  const [activeTab, setActiveTab] = useState("tab1");
  const { copy, isCopied } = useClipBoard();

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="bg-white sm:bg-primary/10 h-svh md:py-5 overflow-scroll scrollbar-hide">
      <div className="mx-auto sm:max-w-[22rem]">
        <div className="hidden sm:flex items-center justify-end mb-1">
          <div
            role="button"
            className="h-6 w-6 rounded-full bg-dark/10 flex items-center justify-center"
          >
            <XIcon size={18} className="text-primary" />
          </div>
        </div>
        <div className="bg-primary/20 sm:shadow-xl sm:rounded-2xl overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between">
            <Image
              src={favicon.main}
              width={260}
              height={260}
              alt={`dexa`}
              className="h-10 w-10"
            />
            <p className="font-semibold text-lg">Dexapay</p>
          </div>
          <div className="bg-white py-5 sm:rounded-t-3xl">
            <div className="px-5">
              <div className="bg-primary/10 p-2 rounded-lg flex items-start gap-x-1">
                <InfoIcon size={15} className="text-primary mt-1" />
                <p className="text-sm">
                  Please do not close this window until payment is confirmed
                </p>
              </div>
              <div className="text-center mt-5">
                <p className="text-3xl font-semibold text-primary">1.0 BNB</p>
                <p className="text-medium">
                  Time remaining <span className="text-primary">12:00</span>
                </p>
              </div>
            </div>
            <div className="mt-5">
              <TabsRoot>
                <TabsList className="shadow-md">
                  <TabsHeader
                    isActiveText={true}
                    title="Scan"
                    value="tab1"
                    activeTabId={activeTab}
                    onTabChange={onTabChange}
                    isCenter={true}
                    isActiveBg={true}
                    textPos="CENTER"
                    //   isMarker={false}
                    className="h-[2.5rem]"
                  />
                  <TabsHeader
                    isActiveText={true}
                    title="Copy"
                    value="tab2"
                    activeTabId={activeTab}
                    onTabChange={onTabChange}
                    isCenter={true}
                    isActiveBg={true}
                    textPos="CENTER"
                    //   isMarker={false}
                    className="h-[2.5rem]"
                  />
                </TabsList>
                <TabsContent value="tab1" activeTabId={activeTab}>
                  <div className="flex-1 mt-1 flex flex-col items-center justify-center px-5 pt-3 pb-6">
                    <div className="mb-4">
                      <p className="text-medium text-sm text-center">
                        Scan the QR code using your preferred wallet to make
                        0.00438 BNB payment.
                      </p>
                    </div>
                    <div className="flex items-center border-[6px] border-primary justify-center">
                      <QRCode
                        value="0x719c1A5dac69C4C6b462Aa7E8Fb9bc90Ec9128b9"
                        fgColor="#4338ca"
                        size={160}
                        ecLevel="L"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="tab2" activeTabId={activeTab}>
                  <div className="flex-1 mt-1 px-5 py-5">
                    <div>
                      <p className="text-primary/80 text-sm text-center">
                        To complete your payment, please send{" "}
                        <span className="font-semibold">0.0004283 BNB</span> to
                        the address below.
                      </p>
                    </div>
                    <div className="mt-7">
                      <Label title="Amount" />
                      <div
                        role="button"
                        className="border border-light rounded-md justify-between py-2 flex gap-x-2 bg-light px-3"
                      >
                        <div className="flex-1">
                          <p className="truncate">0.034 BNB</p>
                        </div>
                        <CopyIcon size={20} className="text-primary" />
                      </div>
                    </div>
                    <div className="mt-5 mb-6">
                      <Label title="Wallet Address" />
                      <div
                        role="button"
                        className="border border-light rounded-md justify-between py-2 flex gap-x-2 bg-light px-3"
                      >
                        <div className="truncate flex-1">
                          <p>0x719c1A5dac69C4C6b462Aa7E8Fb9bc90Ec9128b9</p>
                        </div>
                        <CopyIcon size={20} className="text-primary" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </TabsRoot>
            </div>
            <div className="px-5">
              <Button kind="primary" className="w-full h-12">
                Login and pay
              </Button>
              {/* <Button kind="clear" className="w-full mt-2">
                <p className="text-primary font-semibold text-sm">
                  Login and pay
                </p>
              </Button> */}
              <div className="flex items-center mt-10 justify-center gap-x-1">
                <p className="text-sm text-medium">
                  Don&apos;t have a Dexapay account?
                </p>
                <Link href="/" className="text-primary font-semibold text-sm">
                  Register
                </Link>
              </div>
              <div className="flex items-center justify-center gap-x-2 mt-3">
                <p className="text-medium text-center text-sm">Powered By</p>
                <div className="flex items-center gap-x-1">
                  <Image
                    src={favicon.main}
                    width={260}
                    height={260}
                    alt={`dexa`}
                    className="h-5 w-5"
                  />
                  <p className="text-primary text-sm font-black uppercase">
                    Dexa pay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
