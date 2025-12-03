import { useAccount, useWriteContract } from "wagmi";
import { useDexa } from "@/context/dexa.context";
import { useAuth } from "@/context/auth.context";
import { useWriteContracts } from "wagmi/experimental";
import useToast from "../toast.hook";
import useDexaCapabilities from "../capabilities.hook";
import { parseEther } from "ethers";
import { addBeneficiary } from "@/actions/beneficiary.action";

interface ITransferFunction {
  to: string;
  token: string;
  amount: string;
  closeModal: () => void;
  resetForm: () => void;
  tokenName: string;
  remark: string;
  username: string;
}

function useTransfer() {
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
    remark,
    username,
  }: ITransferFunction) => {
    try {
      loading({
        msg: "Initiating transfer",
      });
      await addBeneficiary({ user: `${address}`, wallet: to, name: username });
      const contractProps: any = {
        abi: GatewayAbi,
        address: GatewayAddr,
        functionName: "transferInternal",
        args: [to, parseEther(`${amount}`), token, remark],
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
                msg: `${amount} ${tokenName} transferred successfully`,
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
                msg: `${amount} ${tokenName} transferred successfully`,
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
      if (err instanceof Error) {
        error({ msg: err.message });
      }
      if (err && typeof err === "object") {
        error({ msg: JSON.stringify(err) });
      }
    }
  };

  return {
    onSubmit,
    isPending: isContPending || isContsPending,
  };
}

export default useTransfer;
