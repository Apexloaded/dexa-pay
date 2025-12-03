import { useAuth } from "@/context/auth.context";
import React from "react";
import Label from "../Form/Label";
import Input from "../Form/Input";
import { formatWalletAddress, timestampToDate } from "@/libs/helpers";
import { CheckCheck, CopyIcon } from "lucide-react";
import useClipBoard from "@/hooks/clipboard.hook";
import Button from "../Form/Button";

function APIKeyTab() {
  const { user } = useAuth();
  const { copy, isCopied } = useClipBoard();

  return (
    <div className="w-full">
      <div className="bg-white max-w-4xl mx-auto mt-10 p-7">
        <div className="text-center max-w-md mx-auto">
          <p className="text-medium text-lg font-light">
            API Configuration - Testnet
          </p>
          <p className="text-medium font-light">
            Dexapay will notify you about your transactions via email in the
            email address that you linked to your account below.
          </p>
        </div>
        <div className="max-w-xl mx-auto flex flex-col gap-y-7 my-8">
          <div className="flex gap-x-5 items-center">
            <Label title="Secret Key" className="w-24 md:w-32 text-right" />
            <div className="flex items-center flex-1 relative bg-white border border-medium/60 rounded-md overflow-hidden">
              <Input
                type={"password"}
                isOutline={false}
                className="text-sm"
                placeholder=""
                readOnly
              />
              <div role="button" onClick={() => copy("")} className="p-4">
                <CopyIcon className="text-primary" size={20} />
              </div>
            </div>
          </div>
          <div className="flex gap-x-5 items-center">
            <Label title="Public Key" className="w-24 md:w-32 text-right" />
            <div className="flex items-center flex-1 relative bg-white border border-medium/60 rounded-md overflow-hidden">
              <Input
                type={"text"}
                isOutline={false}
                className="text-sm"
                placeholder=""
                readOnly
              />
              <div role="button" onClick={() => copy("")} className="p-4">
                <CopyIcon className="text-primary" size={20} />
              </div>
            </div>
          </div>
          <div className="flex gap-x-5 items-center">
            <Label title="Callback URL" className="w-24 md:w-32 text-right" />
            <div className="grid grid-cols-1 flex-1">
              <Input
                type="text"
                className="border border-medium/40 focus:outline-primary text-dark/70 rounded-md"
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex gap-x-5 items-center">
            <Label title="Webhook URL" className="w-24 md:w-32 text-right" />
            <div className="grid grid-cols-1 flex-1">
              <Input
                type="text"
                className="border border-medium/40 focus:outline-primary text-dark/70 rounded-md"
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button kind={"primary"} type="button" disabled={true}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default APIKeyTab;
