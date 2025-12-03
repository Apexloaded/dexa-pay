"use client";

import React, { useState, useRef } from "react";
import Label from "../Form/Label";
import Input from "../Form/Input";
import Button from "../Form/Button";
import { CircleHelp } from "lucide-react";
import Select, { Options } from "../Form/Select";
import { Tokens } from "@/libs/tokens";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { useAccount, useWriteContract } from "wagmi";
import { useDexa } from "@/context/dexa.context";
import ShowError from "../Form/ShowError";
import useToast from "@/hooks/toast.hook";
import { parseEther } from "ethers";
import TextArea from "../Form/TextArea";
import Radio from "../Form/Radio";
import Tooltip from "../Form/ToolTip";
import FileSelector from "../ui/FileSelector";
import { PaymentScheme } from "@/interfaces/bills.interface";
import {
  Select as SelectContainer,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFile } from "@/actions/pinata.action";
import { PinResponse } from "pinata-web3";
import { IPFS_URL } from "@/config/constants";

interface Props {
  closeModal: () => void;
}

const durationOptions = [
  { value: 7 * 24 * 60 * 60, label: "7 Days" },
  { value: 14 * 24 * 60 * 60, label: "14 Days" },
  { value: 30 * 24 * 60 * 60, label: "1 Month" },
];

function CreateGroupForm({ closeModal }: Props) {
  const {
    trigger,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const billImgRef = useRef<HTMLInputElement>(null);
  const { address, chainId } = useAccount();
  const { error, loading, success } = useToast();
  const [resetKey, setResetKey] = useState<number>(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [selectedToken, setSelectedToken] = useState<Options>();
  const { TaxesAddr, TaxesAbi } = useDexa();
  const { writeContractAsync, isPending, data } = useWriteContract();
  const [options] = useState(
    Tokens.map((t) => {
      return { value: t.address, name: t.symbol, icon: t.icon };
    })
  );

  const onSubmit = async (payload: FieldValues) => {
    try {
      const { title, description, duration, scheme, token, amount, image } =
        payload;
      loading({
        msg: "Requesting...",
      });

      let logoUrl;

      if (logo) {
        const formData = new FormData();
        formData.append("image", logo);
        const response = await uploadFile(formData);
        if (response.status) {
          const { IpfsHash } = response.data as PinResponse;
          logoUrl = `https://${IpfsHash}.${IPFS_URL}`;
        }
      }

      await writeContractAsync(
        {
          abi: TaxesAbi,
          address: TaxesAddr,
          functionName: "createCooperative",
          args: [
            title,
            description,
            logoUrl,
            parseEther(`${amount || 0}`),
            Number(duration),
            [address],
            token,
            scheme,
          ],
        },
        {
          onSuccess: async (data) => {
            success({
              msg: `Group created successfully`,
            });
            closeModal();
            resetForm();
          },
          onError(err) {
            error({ msg: `${err.message}` });
          },
        }
      );
    } catch (err) {
      console.log(err);
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
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex-1">
        <Label title="Name" isMargin={true} isRequired={true} />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center relative bg-light">
              <Input
                type={"text"}
                isOutline={false}
                className="bg-white border rounded-md border-medium/60 text-sm"
                placeholder="Name of the group"
                onChange={onChange}
                value={value ? value : ""}
              />
            </div>
          )}
          rules={{
            required: "Enter group name",
            validate: (value: string) =>
              value.length > 5 || "Enter a valid name",
          }}
          name={"title"}
        />
        {errors.title && <ShowError error={`${errors.title?.message}`} />}
      </div>
      <div className="flex-1">
        <div className="relative flex items-center gap-x-1">
          <Label title="Token" isMargin={false} isRequired={true} />
          <Tooltip
            tooltipText="Choose which token which group members will pay with"
            position={"TOP"}
          >
            <CircleHelp size={18} />
          </Tooltip>
        </div>
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
      <div className="flex-1 grid grid-cols-2 gap-5">
        <div>
          <Label title="Amount" isMargin={true} isRequired={true} />
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center relative bg-light">
                <Input
                  type={"text"}
                  isOutline={false}
                  className="bg-white border rounded-md border-medium/60 text-sm"
                  placeholder="Contribution amount"
                  onChange={onChange}
                  value={value ? value : ""}
                />
              </div>
            )}
            rules={{
              required: "Enter contribution amount",
              min: 0 || "Enter a valid amount",
            }}
            name={"amount"}
          />
          {errors.amount && <ShowError error={`${errors.amount?.message}`} />}
        </div>
        <div>
          <Label title="Duration" isMargin={true} isRequired={true} />
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center relative bg-light">
                <SelectContainer onValueChange={onChange} defaultValue={value}>
                  <SelectTrigger className="w-full h-[3.2rem] bg-white border rounded-md border-medium/60 text-sm">
                    <SelectValue placeholder="Choose Duration" className="" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((dur, index) => (
                      <SelectItem value={`${dur.value}`} key={index}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectContainer>
              </div>
            )}
            rules={{
              required: "Select a duration",
            }}
            name={"duration"}
          />
          {errors.duration && (
            <ShowError error={`${errors.duration?.message}`} />
          )}
        </div>
      </div>
      <div className="flex-1">
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <>
              <Label title="Description" isMargin={true} isRequired={true} />
              <TextArea
                className="bg-white border border-medium/60 rounded-md py-2 text-sm"
                placeholder="Describe what this contribution group is all about"
                value={value}
                onChange={onChange}
                rows={4}
              />
            </>
          )}
          rules={{
            required: "Tell your contributors more about this group",
            validate: (value: string) =>
              value.length > 20 || "Enter a valid message",
          }}
          name={"description"}
          defaultValue={""}
        />
        {errors.description && (
          <ShowError error={`${errors.description?.message}`} />
        )}
      </div>
      <div className="flex-1">
        <Label title="Logo" isMargin={true} isRequired={true} />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="mt-2">
              <FileSelector
                onSelect={async (ev) => {
                  if (ev.target.files) {
                    const file = ev.target.files[0];
                    onChange(file);
                    const isValid = await trigger("image");
                    if (isValid) setLogo(file);
                  }
                }}
                ref={billImgRef}
                accept="image/png, image/jpeg, image/gif, image/jpg"
              />
              <div
                role="button"
                onClick={() => {
                  if (billImgRef.current) billImgRef.current.click();
                }}
                className="border border-dashed border-medium/60 py-2 rounded-md"
              >
                <p className="text-sm text-center text-medium">Choose a file</p>
              </div>
            </div>
          )}
          name={"image"}
        />
        {errors.image && <ShowError error={`${errors.image?.message}`} />}
      </div>
      <div className="flex-1">
        <div className="relative flex items-center gap-x-1 mb-2">
          <Label title="Payment Scheme" isMargin={false} isRequired={true} />
          <Tooltip
            tooltipText="How many persons can participate in this bill"
            position={"TOP"}
          >
            <CircleHelp size={18} />
          </Tooltip>
        </div>

        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-x-2">
                <Radio
                  type="radio"
                  name="scheme"
                  onChange={onChange}
                  value={PaymentScheme.Rotation}
                />
                <p className="text-medium text-sm">Rotation</p>
              </div>
              <div className="flex items-center gap-x-2">
                <Radio
                  type="radio"
                  name="scheme"
                  onChange={onChange}
                  value={PaymentScheme.Random}
                />
                <p className="text-medium text-sm">Random</p>
              </div>
            </div>
          )}
          rules={{
            required: "Select group payment scheme",
          }}
          name={"scheme"}
        />
        {errors.scheme && <ShowError error={`${errors.scheme?.message}`} />}
      </div>
      {/* <div className="flex-1">
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <>
              <div className="flex items-center gap-x-2">
                <Radio
                  type="checkbox"
                  onChange={() => setIsFixedAmt(!isFixedAmt)}
                  checked={isFixedAmt}
                />
                <p className="text-medium">
                  I want a fixed payment amount on this bill
                </p>
              </div>
              {isFixedAmt && (
                <Input
                  type={"text"}
                  isOutline={false}
                  className="bg-white border border-medium/60 rounded-md text-sm mt-3"
                  placeholder="Min amount: 0.01"
                  onChange={(e) => {
                    onChange(e);
                  }}
                  value={value ? value : ""}
                />
              )}
            </>
          )}
          rules={
            isFixedAmt
              ? {
                  required: "Enter bill amount",
                  min: 0 || "Enter a valid amount",
                }
              : {}
          }
          name={"amount"}
          defaultValue={""}
        />
        {isFixedAmt && errors.amount && (
          <ShowError error={`${errors.amount?.message}`} />
        )}
      </div> */}
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
              <div className="flex items-center justify-center">
                <p>{`Create`}</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupForm;
