"use client";

import { useMemo, useState } from "react";
import { usePublicDecrypt } from "@zama-fhe/react-sdk";
import toast from "react-hot-toast";
import { useChainId, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { type PendingExit } from "~~/hooks/markets/useMarketPositions";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

type ExitActionProps = {
  isOpen: boolean;
  onchainMarketId?: string;
  outcome: 0 | 1;
  pendingExit?: PendingExit;
  isPendingExitLoading?: boolean;
  onExited?: () => void | Promise<void>;
};

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to process the exit transaction.";

export function ExitAction({
  isOpen,
  onchainMarketId,
  outcome,
  pendingExit,
  isPendingExitLoading,
  onExited,
}: ExitActionProps) {
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const publicDecrypt = usePublicDecrypt();
  const [isWorking, setIsWorking] = useState(false);

  const marketId = useMemo(() => {
    if (!onchainMarketId) {
      return undefined;
    }

    try {
      return BigInt(onchainMarketId);
    } catch {
      return undefined;
    }
  }, [onchainMarketId]);

  const hasContract = Boolean(marketContract?.address && marketContract?.abi);
  const pendingExists = Boolean(pendingExit?.[5]);
  const pendingMarketId = pendingExit?.[0];
  const pendingOutcome = pendingExit?.[1];
  const hasPendingForThisPosition = Boolean(
    pendingExists && marketId !== undefined && pendingMarketId === marketId && pendingOutcome === outcome,
  );
  const hasPendingForAnotherPosition = Boolean(pendingExists && !hasPendingForThisPosition);
  const isBusy = isWorking || publicDecrypt.isPending || Boolean(isPendingExitLoading);

  const refresh = async () => {
    await onExited?.();
  };

  const requestExit = async () => {
    if (!marketContract || marketId === undefined) {
      toast.error("This market is missing an on-chain ID.");
      return;
    }
    if (chainId !== sepolia.id) {
      toast.error("Switch your wallet to Sepolia before exiting a position.");
      return;
    }

    try {
      setIsWorking(true);
      const hash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "requestExitPosition",
        args: [marketId, outcome],
        chainId: sepolia.id,
        gas: 8_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash, chainId: sepolia.id });
      toast.success("Exit requested. Quote handles are ready to decrypt.");
      await refresh();
    } catch (error) {
      toast.error(toErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  const fulfillExit = async () => {
    if (!marketContract || !pendingExit || !hasPendingForThisPosition) {
      return;
    }
    if (chainId !== sepolia.id) {
      toast.error("Switch your wallet to Sepolia before fulfilling this exit.");
      return;
    }

    try {
      setIsWorking(true);
      const [, , , numeratorHandle, denominatorHandle] = pendingExit;
      const decrypted = await publicDecrypt.mutateAsync([numeratorHandle, denominatorHandle]);
      const hash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "fulfillExitPosition",
        args: [decrypted.abiEncodedClearValues, decrypted.decryptionProof],
        chainId: sepolia.id,
        gas: 8_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash, chainId: sepolia.id });
      window.dispatchEvent(new Event("darkonnet:cusdt-balance-refresh"));
      toast.success("Position exited.");
      await refresh();
    } catch (error) {
      toast.error(toErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (!marketId || !hasContract) {
    return (
      <button
        type="button"
        disabled
        className="h-9 w-full rounded-md border border-[#DC2626]/30 px-3 text-xs font-semibold text-[#DC2626] opacity-70 md:w-auto"
      >
        No Contract
      </button>
    );
  }

  if (hasPendingForAnotherPosition) {
    return (
      <button
        type="button"
        disabled
        title={`Finish market ${pendingMarketId?.toString()} ${pendingOutcome === 0 ? "Yes" : "No"} first`}
        className="h-9 w-full rounded-md border border-[#E5E5E5] px-3 text-xs font-semibold text-[#A1A1A1] opacity-70 dark:border-[#1F1F1F] md:w-auto"
      >
        Exit Pending
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={hasPendingForThisPosition ? fulfillExit : requestExit}
      disabled={isBusy}
      className={`smooth-action h-9 w-full rounded-md px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 md:w-auto ${
        hasPendingForThisPosition
          ? "bg-[#FFD60A] text-[#0A0A0A]"
          : "border border-[#E5E5E5] text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
      }`}
    >
      {isBusy ? "Processing" : hasPendingForThisPosition ? "Fulfill Exit" : "Exit Position"}
    </button>
  );
}
