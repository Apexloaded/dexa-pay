"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/Form/Button";
import Radio from "@/components/Form/Radio";
import WalletSearch from "@/components/Wallet/WalletSearch";
import Header from "@/components/ui/Header";
import TabsRoot from "@/components/Tabs/TabsRoot";
import TabsList from "@/components/Tabs/TabsList";
import TabsHeader from "@/components/Tabs/TabsHeader";
import TabsContent from "@/components/Tabs/TabsContent";
import AssetsTable from "@/components/Wallet/AssetsTable";
import { useConverter } from "@/context/currency.context";
import { useDexa } from "@/context/dexa.context";
import { useAuth } from "@/context/auth.context";
import { useAccount, useReadContract } from "wagmi";
import {
  formatCur,
  timestampToDate,
  toOxString,
  walletToLowercase,
  weiToUnit,
} from "@/libs/helpers";
import { UserBalance } from "@/interfaces/user.interface";
//import { Tokens } from "@/config/tokens";
import { useAppSelector, useAppDispatch } from "@/hooks/redux.hook";
import {
  selectHideBalance,
  setHideBalance,
} from "@/slices/account/hide-balance.slice";
import useStorage from "@/hooks/storage.hook";
import { RequestStatus, StorageTypes } from "@/libs/enums";
import ListTransactions from "@/components/Wallet/ListTransactions";
import QuickAction from "@/components/Home/quick-actions/QuickAction";
import TransferModal from "@/components/Wallet/TransferModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import InfoCard from "@/components/Home/cards/InfoCard";
import {
  ArrowDownToDotIcon,
  ArrowUpFromDotIcon,
  BackpackIcon,
  BookDownIcon,
  BookUpIcon,
  ClipboardCheckIcon,
  LockIcon,
} from "lucide-react";
import Container from "@/components/layouts/Container";
import Section from "@/components/layouts/Section";
import Aside from "@/components/layouts/Aside";
import SendPaymentModal from "@/components/Payments/SendPaymentModal";
import {
  IPaymentRequest,
  sortRequestByDate,
} from "@/interfaces/pay-request.interface";
import { Tokens } from "@/libs/tokens";
import PaymentsTable from "@/components/Payments/PaymentsTable";
import RequestPaymentModal from "@/components/Payments/RequestPaymentModal";
import TxCount from "@/components/Transactions/TxCount";
import UserPFP from "@/components/ui/UserPFP";
import { useRouter } from "next/navigation";
import { routes } from "@/libs/routes";

function Wallet() {
  const router = useRouter();
  const isHidden = useAppSelector(selectHideBalance);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("tab1");
  const [isSendModal, setSendModal] = useState<boolean>(false);
  const [isRequestModal, setRequestModal] = useState<boolean>(false);
  const [incomingReq, setIncomingReq] = useState<IPaymentRequest[]>([]);
  const [sentReq, setSentReq] = useState<IPaymentRequest[]>([]);
  const [paidReq, setPaidReq] = useState<IPaymentRequest[]>([]);
  const { setItem } = useStorage();
  const { usdRate, ethRate } = useConverter();
  const { GatewayAddr, GatewayAbi } = useDexa();
  const { user } = useAuth();
  const { data, queryKey } = useReadContract({
    abi: GatewayAbi,
    address: GatewayAddr,
    functionName: "getUserRequests",
    account: toOxString(user?.wallet),
    query: {
      enabled: !!user?.wallet,
    },
  });

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    router.prefetch(routes.app.payments.create);
  }, [router]);

  useEffect(() => {
    const init = async () => {
      if (!data) return;
      const reqWithToken = (data as IPaymentRequest[]).map(
        (req: IPaymentRequest) => {
          const token = Tokens.find(
            (t) => walletToLowercase(t.address) === walletToLowercase(req.token)
          );
          return { ...req, tokenData: token };
        }
      );
      const requests = sortRequestByDate(reqWithToken);
      const incomingRequests = requests.filter(
        (req) => req.recipient == user?.wallet && req.isRequesting == true
      );
      const sentRequest = requests.filter(
        (req) => req.sender == user?.wallet && req.isRequesting == true
      );
      const paidRequests = requests.filter(
        (req) =>
          (req.sender == user?.wallet && req.isRequesting == false) ||
          (req.recipient == user?.wallet && req.isRequesting == false)
      );
      setIncomingReq(incomingRequests);
      setSentReq(sentRequest);
      setPaidReq(paidRequests);
    };
    void init();
  }, [data]);

  const toggleHide = () => {
    const value = !isHidden;
    setItem(StorageTypes.DEXA_HIDE_BAL, value);
    dispatch(setHideBalance(value));
  };

  return (
    <>
      <Container>
        <Section>
          <div className="flex h-full flex-col overflow-scroll scrollbar-hide">
            <div className="flex items-center pr-5 py-4 pl-2 z-50 bg-white justify-between sticky top-0">
              <Header title="Email Pay" isBack={true} />
              <div className="flex items-center gap-x-2">
                <TxCount />
                <UserPFP name={user?.name} />
              </div>
            </div>
            <div>
              <div className="px-5">
                <div className="grid grid-cols-3 w-full pb-3">
                  <InfoCard
                    title={"Total incoming"}
                    amount={`${incomingReq.length}`}
                    Icon={ArrowDownToDotIcon}
                    className="border-y border-l"
                  />
                  <InfoCard
                    title={"Total sent"}
                    amount={`${sentReq.length}`}
                    Icon={ArrowUpFromDotIcon}
                    className="border"
                  />
                  <InfoCard
                    title={"Paid Requests"}
                    amount={`${paidReq.length}`}
                    Icon={ClipboardCheckIcon}
                    className="border-r border-y"
                  />
                </div>
                <div className="flex items-center gap-x-5 pt-5">
                  <Button
                    type="button"
                    kind="primary"
                    shape="NORMAL"
                    className="border border-primary"
                    onClick={() => router.push(routes.app.payments.create)}
                  >
                    <p className="text-white text-sm">Request</p>
                  </Button>
                  {/* <Button
                    type="button"
                    kind="default"
                    shape="NORMAL"
                    className="bg-light hover:bg-medium/20"
                    onClick={() => setSendModal(true)}
                  >
                    <p className="text-primary text-sm">Send Pay</p>
                  </Button> */}
                  <Button
                    type="button"
                    kind="clear"
                    className="border border-primary bg-white hover:bg-light"
                    onClick={() => setSendModal(true)}
                  >
                    <p className="text-primary text-sm">Send Pay</p>
                  </Button>
                </div>
                <div className="flex items-center gap-x-5 pt-5 max-w-lg">
                  <WalletSearch />
                </div>
                <div className="pt-6 pb-20">
                  <TabsRoot>
                    <TabsList className="">
                      <TabsHeader
                        isActiveText={true}
                        title={`Incoming ${
                          incomingReq.length > 0 ? ` ${incomingReq.length}` : ""
                        }`}
                        value="tab1"
                        activeTabId={activeTab}
                        onTabChange={onTabChange}
                        isCenter={false}
                      />
                      <TabsHeader
                        isActiveText={true}
                        title="Outgoing"
                        value="tab2"
                        activeTabId={activeTab}
                        onTabChange={onTabChange}
                        isCenter={false}
                      />
                      <TabsHeader
                        isActiveText={true}
                        title="Paid Requests"
                        value="tab3"
                        activeTabId={activeTab}
                        onTabChange={onTabChange}
                        isCenter={false}
                      />
                    </TabsList>
                    <TabsContent value="tab1" activeTabId={activeTab}>
                      <div className="flex-1 mt-1">
                        <PaymentsTable
                          requests={incomingReq}
                          title="No Pending Request"
                          message="You currently do not have any pending request"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="tab2" activeTabId={activeTab}>
                      <div className="flex-1 mt-1">
                        <PaymentsTable
                          requests={sentReq}
                          title="No Request"
                          message="You have not sent any payment request"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="tab3" activeTabId={activeTab}>
                      <div className="flex-1 mt-1">
                        <PaymentsTable
                          requests={paidReq}
                          title="No Payment Made"
                          message="You have not made any payment using emails"
                        />
                      </div>
                    </TabsContent>
                  </TabsRoot>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Aside>
          <QuickAction showQuickPayBtn={true} />
        </Aside>
      </Container>

      <SendPaymentModal setIsOpen={setSendModal} isOpen={isSendModal} />
      <RequestPaymentModal
        setIsOpen={setRequestModal}
        isOpen={isRequestModal}
      />
    </>
  );
}

export default Wallet;
