"use client";

import React, { useCallback, useEffect, useState } from "react";
import { routes } from "@/libs/routes";
import Link from "next/link";
import ReCaptcha from "./ReCaptcha";
import Button from "../Form/Button";
import ShowError from "../Form/ShowError";
import { CheckCheckIcon, CircleAlertIcon } from "lucide-react";
import Input from "../Form/Input";
import Label from "../Form/Label";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useAccountEffect,
  useReadContract,
  useWriteContract,
} from "wagmi";
import debounce from "debounce";
import useToast from "@/hooks/toast.hook";
import { useDexa } from "@/context/dexa.context";
import { registerUser, verifyCaptcha } from "@/actions/auth.action";
import { ContractError } from "@/libs/enums";
import { registerResolver } from "@/schemas/register.schema";
import WalletConnectModal from "./WalletConnectModal";
import Radio from "../Form/Radio";
import { useAppSelector } from "@/hooks/redux.hook";
import {
  selectConnector,
  selectIsConnected,
} from "@/slices/account/auth.slice";
import useNameAvailability from "@/hooks/dexa-pay/useName.hook";
import { baseSepolia } from "viem/chains";
import { generateToken, tokenNumeric } from "@/libs/generate-id";

const getError = (error: Error): string => {
  const errorMessages: { [key: string]: string } = {
    [ContractError.ERROR_DUPLICATE_RESOURCE]: "User already registered",
    [ContractError.ERROR_INVALID_STRING]: "Invalid display name or username",
  };

  const foundMessage = Object.entries(errorMessages).find(([key]) =>
    error.message.includes(key)
  );

  return foundMessage ? foundMessage[1] : "An error occurred";
};

function RegisterUser() {
  const [token, setToken] = useState<string>();
  const router = useRouter();
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm(registerResolver);
  const username = watch("username");
  const { address } = useAccount();
  const [connectModal, setConnectModal] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const { isConnected, wallet } = useAppSelector(selectConnector);
  const { writeContractAsync } = useWriteContract();
  const { GatewayAbi, GatewayAddr } = useDexa();
  const { error, success, loading } = useToast();
  const { data, refetch } = useReadContract({
    abi: GatewayAbi,
    address: GatewayAddr,
    functionName: "isNameFree",
    args: [username],
    query: { enabled: false },
    chainId: baseSepolia.id,
  });

  // useEffect(() => {
  //   console.log(availablity);
  // }, [availablity]);

  const checkUsername = useCallback(
    debounce(async (username) => {
      if (username) {
        const res = await refetch();
        setIsAvailable(res.data as boolean);
      } else {
        setIsAvailable(null);
      }
    }, 1000),
    []
  );

  const handelRecaptcha = (token: string) => {
    setToken(token);
  };

  const proceed = async (data: FieldValues) => {
    try {
      // const isVerified = await verifyCaptcha(`${token}`);
      // if (!isVerified) {
      //   error({ msg: "Invalid reCAPTCHA" });
      //   return;
      // }

      if (!isConnected) {
        setConnectModal(true);
        return;
      }
      loading({ msg: "Processing..." });
      const payId = generateToken(tokenNumeric, 8, true);
      const { name, username } = data;
      await writeContractAsync(
        {
          abi: GatewayAbi,
          address: GatewayAddr,
          functionName: "registerUser",
          args: [username, name, payId],
        },
        {
          onSuccess: async (data) => {
            await registerUser(`${wallet}`);
            success({ msg: "Profile created" });
            router.replace(routes.login);
          },
          onError(err) {
            const msg = getError(err);
            error({ msg: `${msg}` });
          },
        }
      );
    } catch (err: any) {
      const msg = getError(err);
      error({ msg: `${msg}` });
    }
  };

  return (
    <>
      {connectModal && <WalletConnectModal setModal={setConnectModal} />}
      <div className="flex flex-col">
        <Controller
          control={control}
          render={({ field: { onChange } }) => (
            <Input
              name="bio"
              className="bg-light shadow-sm rounded-lg border border-medium"
              placeholder="Biography"
              onChange={onChange}
              hidden
            />
          )}
          name="bio"
        />
        <Controller
          control={control}
          render={({ field: { onChange } }) => (
            <div>
              <Label title="Display Name" isRequired={true} isMargin={true} />
              <Input
                name="name"
                className="shadow-sm rounded-md border border-medium/30"
                placeholder="John Doe"
                onChange={onChange}
              />
              {errors.name && <ShowError error={errors.name.message} />}
            </div>
          )}
          name={"name"}
        />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="mt-5">
              <Label title="Username" isRequired={true} isMargin={true} />
              <Input
                name="username"
                className="shadow-sm rounded-md border border-medium/30"
                placeholder="@james"
                onChange={(e) => {
                  onChange(e);
                  checkUsername(e.target.value);
                  setIsAvailable(null);
                }}
              />
              {isAvailable == null && username?.length > 0 && (
                <p className="text-info font text-sm">Checking...</p>
              )}
              {isAvailable == false && username?.length > 0 && (
                <div className="flex items-center gap-1">
                  <p className="text-danger font text-sm">Username Taken</p>
                  <CircleAlertIcon size={18} className="text-danger" />
                </div>
              )}
              {isAvailable == true && username?.length > 0 && (
                <div className="flex items-center gap-1">
                  <p className="text-primary font text-sm">Available</p>
                  <CheckCheckIcon size={18} className="text-primary" />
                </div>
              )}
              {errors.username && <ShowError error={errors.username.message} />}
            </div>
          )}
          name={"username"}
        />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center gap-x-2 mt-2">
              <Radio
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.currentTarget.checked)}
              />
              <p className="text-sm">
                I agree to the{" "}
                <Link className="font-semibold text-primary" href={"/terms"}>
                  terms & Conditions
                </Link>{" "}
              </p>
            </div>
          )}
          name="terms"
          defaultValue={true}
        />

        <div className="flex flex-col gap-5 mt-8">
          <Button
            onClick={handleSubmit(proceed)}
            shape={"NORMAL"}
            type="submit"
            className="h-12"
            kind="primary"
            disabled={isSubmitting || !isValid}
          >
            {isConnected ? "Sign up" : "Connect Wallet"}
          </Button>
          <p className="text-center">
            Already registered?{" "}
            <Link href={routes.login} className="text-primary">
              Login
            </Link>
          </p>
          {/* <ReCaptcha onVerify={handelRecaptcha} /> */}
        </div>
      </div>
    </>
  );
}

export default RegisterUser;
