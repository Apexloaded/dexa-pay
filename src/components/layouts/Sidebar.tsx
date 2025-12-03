"use client";

import React from "react";
import Image from "next/image";
import { favicon } from "@/components/Icons/Connector";
import * as Popover from "@radix-ui/react-popover";
import { getFirstLetters } from "@/libs/helpers";
import {
  CheckCheck,
  CopyIcon,
  EllipsisIcon,
  HandCoinsIcon,
  HomeIcon,
  LandmarkIcon,
  LogOutIcon,
  ReceiptIcon,
  Rotate3DIcon,
  SettingsIcon,
  Wallet2Icon,
} from "lucide-react";
import { useAuth } from "@/context/auth.context";
import { routes } from "@/libs/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import UserPFP from "../ui/UserPFP";
import useClipBoard from "@/hooks/clipboard.hook";

export default function Sidebar() {
  const path = usePathname();
  const isXsScreen = useMediaQuery("(max-width: 500px)");
  const { user, logout } = useAuth();
  const { copy, isCopied } = useClipBoard();

  const navigation = [
    { name: "Home", href: routes.app.home, icon: HomeIcon },
    {
      name: "ePay",
      href: routes.app.payments.index,
      icon: Wallet2Icon,
    },
    {
      name: "Taxes",
      href: routes.app.taxes.index,
      icon: Rotate3DIcon,
    },
    {
      name: "Funding",
      href: routes.app.funding.index,
      icon: HandCoinsIcon,
    },
    {
      name: "Settings",
      href: routes.app.settings,
      icon: SettingsIcon,
    },
  ];

  const isActive = (url: string) => path.includes(url);

  return (
    <div
      className={`w-20 xl:w-56 border-r border-light py-5 hidden xs:flex flex-col justify-between`}
    >
      <div className="flex-1">
        <div className="px-5 flex items-center gap-x-2 mb-5">
          <Image
            src={favicon.main}
            width={260}
            height={260}
            alt={`dexa`}
            className="h-10 w-10"
          />
          <p className="text-primary hidden xl:inline text-2xl font-black">
            Dexapay
          </p>
        </div>
        <div>
          {navigation.map((nav, key) => (
            <Link
              prefetch={true}
              href={nav.href}
              key={key}
              className={`flex group ${
                isActive(nav.href)
                  ? "border-l-4 border-primary"
                  : "border-l-4 border-transparent"
              } `}
            >
              <div
                className={`flex justify-center xl:justify-start w-full px-5 py-2 space-x-2 group-hover:bg-primary/10 transition-all duration-200 `}
              >
                <nav.icon
                  className={`group-hover:text-primary ${
                    isActive(nav.href) ? "text-primary" : ""
                  }`}
                  size={23.5}
                />
                <p
                  className={`hidden xl:inline group-hover:text-primary text-base ${
                    isActive(nav.href) ? "text-primary font-semibold" : ""
                  }`}
                >
                  {nav.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="">
        <Popover.Root>
          <Popover.Trigger className="w-full">
            <div className="outline-none flex justify-center xl:justify-start w-full">
              <div className="h-14 xl:px-3 border-y border-light hover:bg-light cursor-pointer flex items-center justify-end xl:justify-between w-auto xl:w-full">
                <div className="flex justify-end items-center gap-x-2">
                  <div className="w-9">
                    <div className="hover:bg-dark/20 cursor-pointer h-9 w-9 rounded-full absolute"></div>
                    <UserPFP name={user?.name} />
                  </div>
                  <div className="hidden xl:flex flex-col items-start">
                    <p className="font-bold text-sm">{user?.name}</p>
                    <div
                      className="flex items-center gap-x-2 -mt-1"
                      role="button"
                      onClick={async () => {
                        await copy(`${user?.payId}`);
                      }}
                    >
                      <div className="flex items-center gap-x-1">
                        <p className="text-sm text-medium">ID:</p>
                        <p className="text-sm text-medium">{user?.payId}</p>
                      </div>
                      {isCopied ? (
                        <CheckCheck size={16} className="text-primary" />
                      ) : (
                        <CopyIcon size={15} />
                      )}
                    </div>
                  </div>
                </div>
                <EllipsisIcon className="hidden xl:inline" size={25} />
              </div>
            </div>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="shadow-xl w-20 xl:w-[13.9rem] bg-white cursor-pointer overflow-hidden"
              sideOffset={5}
            >
              <div className="flex flex-col">
                <div
                  onClick={logout}
                  role="button"
                  className="p-3 flex hover:bg-light items-center gap-2"
                >
                  <LogOutIcon className="" size={15} />
                  <p className="font-semibold text-sm text-danger">
                    Logout{" "}
                    <span className="hidden lg:inline">@{user?.username}</span>
                  </p>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
