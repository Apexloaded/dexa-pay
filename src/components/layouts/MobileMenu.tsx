"use client";
import React, { useEffect } from "react";
import Button from "../Form/Button";
import { HandCoinsIcon, HomeIcon, SettingsIcon, Wallet2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth.context";
import { routes } from "@/libs/routes";

function MobileMenu() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    router.prefetch(routes.app.payments.index);
    router.prefetch(routes.app.home);
    router.prefetch(routes.app.funding.index);
    router.prefetch(routes.app.settings);
  }, []);

  const navigateTo = (url: string) => {
    router.push(url);
  };

  return (
    <div
      className={`h-14 xs:hidden bg-white/80 shadow-sm border-t border-light w-full`}
    >
      <div className="px-5 flex items-center h-full justify-between">
        <Button
          onClick={() => navigateTo(routes.app.home)}
          type={"button"}
          kind={"default"}
          shape={"CIRCLE"}
          className="bg-transparent"
          hoverColor={false}
        >
          <HomeIcon height={23} />
        </Button>
        <Button
          onClick={() => {
            navigateTo(routes.app.payments.index);
          }}
          type={"button"}
          kind={"default"}
          shape={"CIRCLE"}
          className="bg-transparent"
          hoverColor={false}
        >
          <Wallet2Icon height={23} />
        </Button>
        <Button
          onClick={() => {
            navigateTo(routes.app.funding.index);
          }}
          type={"button"}
          kind={"default"}
          shape={"CIRCLE"}
          className="bg-transparent"
          hoverColor={false}
        >
          <HandCoinsIcon height={23} />
        </Button>
        <Button
          onClick={() => {
            navigateTo(routes.app.settings);
          }}
          type={"button"}
          kind={"default"}
          shape={"CIRCLE"}
          className="bg-transparent"
          hoverColor={false}
        >
          <SettingsIcon height={23} />
        </Button>
      </div>
    </div>
  );
}

export default MobileMenu;
