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
import { createBill } from "@/actions/bill.action";
import { ParticipantType } from "@/interfaces/bills.interface";

interface Props {
  closeModal: () => void;
}
function CreateBillForm({ closeModal }: Props) {
  const {
    trigger,
    control,
    setValue,
    reset,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm();
  const billImgRef = useRef<HTMLInputElement>(null);
  const { address, chainId } = useAccount();
  const { error, loading, success } = useToast();
  const [resetKey, setResetKey] = useState<number>(0);
  const [billImage, setBillImage] = useState<File | null>(null);
  const [isFixedAmt, setIsFixedAmt] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Options>();
  const { FundingAbi, FundingAddr } = useDexa();
  const { writeContractAsync, isPending, data } = useWriteContract();
  const [options] = useState(
    Tokens.map((t) => {
      return { value: t.address, name: t.symbol, icon: t.icon };
    })
  );

  const onSubmit = async (payload: FieldValues) => {
    try {
      const { title, description, participant, token, amount } = payload;
      loading({
        msg: "Requesting...",
      });

      const newBill = await createBill({
        title,
        description,
        participantType: participant,
        billToken: token,
        amount,
        isFixedAmount: isFixedAmt,
        creator: address,
      });
      if (newBill.status !== true) {
        return error({ msg: `${newBill.message}` || "Error creating bill" });
      }
      const billId = newBill.data.id;
      await writeContractAsync(
        {
          abi: FundingAbi,
          address: FundingAddr,
          functionName: "createBill",
          args: [
            billId,
            title,
            description,
            parseEther(`${amount || 0}`),
            token,
            participant,
            isFixedAmt,
          ],
        },
        {
          onSuccess: async (data) => {
            success({
              msg: `Bill created successfully`,
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
        <Label title="Title" isMargin={true} isRequired={true} />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center relative bg-light">
              <Input
                type={"text"}
                isOutline={false}
                className="bg-white border rounded-md border-medium/60 text-sm"
                placeholder="Name your bill"
                onChange={onChange}
                value={value ? value : ""}
              />
            </div>
          )}
          rules={{
            required: "Enter bill title",
            validate: (value: string) =>
              value.length > 5 || "Enter a valid title",
          }}
          name={"title"}
        />
        {errors.title && <ShowError error={`${errors.title?.message}`} />}
      </div>
      <div className="flex-1">
        <div className="relative flex items-center gap-x-1">
          <Label title="Token" isMargin={false} isRequired={true} />
          <Tooltip
            tooltipText="Choose which token this bill will be paid with."
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
      <div className="flex-1">
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <>
              <Label title="Description" isMargin={true} isRequired={true} />
              <TextArea
                className="bg-white border border-medium/60 rounded-md py-2 text-sm"
                placeholder="Bill description or extra instructions"
                value={value}
                onChange={onChange}
                rows={4}
              />
            </>
          )}
          rules={{
            required: "Send a message along with your request",
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
        <Label
          title="Bill Image (Optional)"
          isMargin={true}
          isRequired={true}
        />
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
                    if (isValid) setBillImage(file);
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
          <Label title="Participant(s)" isMargin={false} isRequired={true} />
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
            <div className="flex justify-start gap-x-5 mt-1 items-center">
              <div className="flex items-center gap-x-2">
                <Radio
                  type="radio"
                  name="participant"
                  onChange={onChange}
                  value={ParticipantType.Single}
                />
                <p className="text-medium text-sm">Single</p>
              </div>
              <div className="flex items-center gap-x-2">
                <Radio
                  type="radio"
                  name="participant"
                  onChange={onChange}
                  value={ParticipantType.Multiple}
                />
                <p className="text-medium text-sm">Multiple</p>
              </div>
            </div>
          )}
          rules={{
            required: "Select how many persons can participate",
          }}
          name={"participant"}
        />
        {errors.category && <ShowError error={`${errors.category?.message}`} />}
      </div>
      <div className="flex-1">
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

export default CreateBillForm;
