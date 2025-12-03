"use client";

import React, { useState } from "react";
import Label from "../Form/Label";
import Input from "../Form/Input";
import Button from "../Form/Button";
import { ClipboardPenLineIcon } from "lucide-react";
import Select, { Options } from "../Form/Select";
import { Tokens } from "@/libs/tokens";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { useAccount } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";
import { useDexa } from "@/context/dexa.context";
import { walletToLowercase } from "@/libs/helpers";
import ShowError from "../Form/ShowError";
import useClipBoard from "@/hooks/clipboard.hook";
import useToast from "@/hooks/toast.hook";
import { parseEther, hexlify, toUtf8Bytes } from "ethers";
import TextArea from "../Form/TextArea";
import { sendPayWithEmail } from "@/actions/request.action";
import { useAuth } from "@/context/auth.context";
import useDexaCapabilities from "@/hooks/capabilities.hook";
import useSocket from "@/hooks/socket.hook";
import { SocketEvents } from "@/libs/enums";
import { RequestPaymentEvent } from "@/interfaces/pay-request.interface";

type Props = {
  closeModal?: () => void;
};
function RequestPaymentForm({ closeModal }: Props) {
  const {
    trigger,
    control,
    setValue,
    reset,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm();
  const { address, chainId } = useAccount();
  const { paste } = useClipBoard();
  const { error, loading, success } = useToast();
  const { emit } = useSocket();
  const { user, isSmartWallet } = useAuth();
  const [resetKey, setResetKey] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<Options>();
  const { GatewayAddr, GatewayAbi } = useDexa();
  const { data: callID, writeContracts, isPending } = useWriteContracts();
  const [options] = useState(
    Tokens.map((t) => {
      return { value: t.address, name: t.symbol, icon: t.icon };
    })
  );
  const capabilities = useDexaCapabilities({ chainId, address, isSmartWallet });

  const onPaste = async () => {
    const text = await paste();
    if (!text) return;
    setValue("to", text);
    trigger("to");
  };

  const onSubmit = async (payload: FieldValues) => {
    try {
      const { to, token, amount, remark } = payload;
      loading({
        msg: "Requesting...",
      });
      const paymentToken = Tokens.find(
        (t) =>
          walletToLowercase(t.address) ==
          walletToLowercase(`${selectedToken?.value}`)
      );
      console.log(paymentToken);
      const paymentReq = await sendPayWithEmail({
        email: to,
        senderName: user?.name || "",
        tokenAddress: token,
        tokenName: paymentToken?.name || "",
        amount,
        tokenSymbol: paymentToken?.symbol || "",
        from: `${address}`,
        isRequest: true,
      });
      const payId = hexlify(toUtf8Bytes(paymentReq.data.paymentId));
      const email = hexlify(toUtf8Bytes(paymentReq.data.email));
      writeContracts(
        {
          contracts: [
            {
              abi: GatewayAbi,
              address: GatewayAddr,
              functionName: "requestPayment",
              args: [token, parseEther(`${amount}`), email, remark, payId],
            },
          ],
          capabilities,
        },
        {
          onSuccess: async (data) => {
            emit<RequestPaymentEvent>(SocketEvents.PaymentRequested, {
              sender: address,
              email,
              amount,
              paymentCode: payId,
            });
            success({
              msg: `${amount} ${paymentToken?.symbol} requested`,
            });
            if (closeModal) closeModal();
            resetForm();
          },
          onError(err) {
            error({ msg: `${err.message}` });
          },
        }
      );
    } catch (err) {
      if (err instanceof Error) {
        error({ msg: err.message });
      }
      if (err && typeof err === "object") {
        error({ msg: JSON.stringify(err) });
      }
    }
  };

  const resetForm = () => {
    reset();
    setResetKey((prevKey) => prevKey + 1);
    setSelectedToken(undefined);
  };

  return (
    <div className="flex flex-col gap-3 md:gap-6">
      <div className="flex-1">
        <Label title="Token" isMargin={true} isRequired={true} />
        <Controller
          control={control}
          render={({ field: { onChange } }) => (
            <Select
              options={options}
              placeholder="Choose option"
              onSelect={(token) => {
                setSelectedToken(token);
                onChange(token.value);
              }}
              key={resetKey}
              className="bg-white border border-medium/60 rounded-md"
            />
          )}
          name={"token"}
          rules={{
            required: "Choose a token",
          }}
        />
        {errors.token && <ShowError error={`${errors.token?.message}`} />}
      </div>
      <div className="flex-1">
        <Label title="Email address" isMargin={true} isRequired={true} />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center relative bg-white border border-medium/60 rounded-md overflow-hidden">
              <Input
                type={"email"}
                isOutline={false}
                className="bg-white text-sm"
                placeholder="email@example.com"
                onChange={onChange}
                value={value ? value : ""}
              />
              <div role="button" onClick={onPaste} className="p-4">
                <ClipboardPenLineIcon className="text-primary" size={20} />
              </div>
            </div>
          )}
          rules={{
            required: "Enter an email address",
            pattern: {
              value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,
              message: "Email address is not valid",
            },
          }}
          name={"to"}
        />
        {errors.to && <ShowError error={`${errors.to?.message}`} />}
      </div>
      <div className="flex-1">
        <Label title="Amount" isMargin={true} isRequired={true} />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center relative bg-white border border-medium/60 rounded-md overflow-hidden">
              <Input
                isOutline={false}
                className="bg-white text-sm"
                placeholder="Min amount: 0.01"
                onChange={(e) => {
                  onChange(e);
                }}
                value={value ? value : ""}
              />
            </div>
          )}
          name={"amount"}
          rules={{
            required: "Enter withdrawal amount",
            min: 0,
            validate: (value) =>
              parseFloat(value) > 0 || "Enter a valid amount",
          }}
        />
        {errors.amount && <ShowError error={`${errors.amount?.message}`} />}
      </div>
      <div className="flex-1">
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <>
              <Label title="Message" isMargin={true} />
              <TextArea
                className="bg-white border border-medium/60 rounded-md py-2 text-sm"
                placeholder="Send a message along with your request."
                value={value}
                onChange={onChange}
                rows={4}
              />
            </>
          )}
          rules={{
            required: "Send a message along with your request",
            validate: (value: string) =>
              value.length > 10 || "Enter a valid message",
          }}
          name={"remark"}
          defaultValue={""}
        />
        {errors.remark && <ShowError error={`${errors.remark?.message}`} />}
      </div>
      <div className="flex-1">
        <div className="flex justify-between mt-6 items-center">
          <div className="flex flex-col"></div>
          <div>
            <Button
              type={"submit"}
              kind={"primary"}
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || isPending}
            >
              <div className="px-3 h-8 flex items-center justify-center">
                <p>{`Request Pay`}</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestPaymentForm;
