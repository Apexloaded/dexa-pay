"use client";

import { createContext, useContext, useState } from "react";
import DexaGateway from "@/contracts/DexaPay";
import DexaFunding from "@/contracts/DexaBill";
import DexaTaxes from "@/contracts/DexaTaxes";
import ERC20Token from "@/contracts/ERC20ABI";
import { toOxString } from "@/libs/helpers";
import { Abi } from "viem";
import {
  GATEWAY_CONTRACT,
  FUNDING_CONTRACT,
  TAXES_CONTRACT,
} from "@/config/constants";

const GATEWAY = toOxString(GATEWAY_CONTRACT);
const FUNDING = toOxString(FUNDING_CONTRACT);
const TAXES = toOxString(TAXES_CONTRACT);

export type DexaContextType = {
  GatewayAbi: Abi;
  FundingAbi: Abi;
  TaxesAbi: Abi;
  ERC20ABI: Abi;
  GatewayAddr: `0x${string}`;
  FundingAddr: `0x${string}`;
  TaxesAddr: `0x${string}`;
};

interface Props {
  children: React.ReactNode;
}

export const DexaContext = createContext<DexaContextType | undefined>(
  undefined
);

export function DexaProvider({ children }: Props) {
  const [GatewayAbi] = useState(DexaGateway);
  const [FundingAbi] = useState(DexaFunding);
  const [TaxesAbi] = useState(DexaTaxes);
  const [ERC20ABI] = useState(ERC20Token);

  const [GatewayAddr] = useState<`0x${string}`>(GATEWAY);
  const [FundingAddr] = useState<`0x${string}`>(FUNDING);
  const [TaxesAddr] = useState<`0x${string}`>(TAXES);

  return (
    <DexaContext.Provider
      value={{
        GatewayAbi,
        FundingAbi,
        TaxesAbi,
        ERC20ABI,
        GatewayAddr,
        FundingAddr,
        TaxesAddr,
      }}
    >
      {children}
    </DexaContext.Provider>
  );
}

export function useDexa() {
  const context = useContext(DexaContext);
  if (context === undefined) {
    throw new Error("useDexa must be used within a DexaProvider");
  }
  return context;
}
