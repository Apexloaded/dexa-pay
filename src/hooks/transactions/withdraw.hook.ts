import { useAccount, useWriteContract } from "wagmi";
import { useDexa } from "@/context/dexa.context";
import { useAuth } from "@/context/auth.context";
import { useWriteContracts } from "wagmi/experimental";
import useToast from "../toast.hook";
import useDexaCapabilities from "../capabilities.hook";
import { parseEther } from "ethers";

interface IWithdrawFunction {
  to: string;
  token: string;
  amount: string;
  closeModal: () => void;
  resetForm: () => void;
  tokenName: string;
}

function useWithdraw() {
  const { GatewayAddr, GatewayAbi } = useDexa();
  const { loading, error, success } = useToast();
  const { address, chainId } = useAccount();
  const { isSmartWallet } = useAuth();
  const { writeContractAsync, isPending: isContPending } = useWriteContract();
  const { writeContractsAsync, isPending: isContsPending } =
    useWriteContracts();
  const capabilities = useDexaCapabilities({
    address,
    chainId,
    isSmartWallet,
  });

  const onSubmit = async ({
    token,
    amount,
    to,
    closeModal,
    resetForm,
    tokenName,
  }: IWithdrawFunction) => {
    try {
      loading({
        msg: "Initiating withdrawal",
      });
      const contractProps: any = {
        abi: GatewayAbi,
        address: GatewayAddr,
        functionName: "transferExternal",
        args: [to, parseEther(`${amount}`), token, ""],
      };
      if (isSmartWallet) {
        await writeContractsAsync(
          {
            contracts: [{ ...contractProps }],
            capabilities,
          },
          {
            onSuccess: async (data) => {
              success({
                msg: `${amount} ${tokenName} withdrawn successfully`,
              });
              closeModal();
              resetForm();
            },
            onError(err) {
              error({ msg: `${err.message}` });
            },
          }
        );
      } else {
        await writeContractAsync(
          { ...contractProps },
          {
            onSuccess: async (data) => {
              success({
                msg: `${amount} ${tokenName} withdrawn successfully`,
              });
              closeModal();
              resetForm();
            },
            onError(err) {
              error({ msg: `${err.message}` });
            },
          }
        );
      }
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

  return { onSubmit, isPending: isContPending || isContsPending };
}

export default useWithdraw;
