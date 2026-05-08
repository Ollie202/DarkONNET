"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicDecrypt } from "@zama-fhe/react-sdk";
import toast from "react-hot-toast";
import { formatUnits, parseEventLogs } from "viem";
import { useChainId, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

type PnlActionProps = {
  isOpen: boolean;
  onchainMarketId?: string;
  outcome: 0 | 1;
  stakeValue?: bigint;
  onPnlResolved?: (pnl: number) => void;
};

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unable to update the PNL quote.");

const formatSignedAmount = (value: bigint) => {
  const sign = value >= 0n ? "+" : "-";
  const absoluteValue = value >= 0n ? value : -value;
  return `${sign}${formatUnits(absoluteValue, 6)} cUSDT`;
};

export function PnlAction({ isOpen, onchainMarketId, outcome, stakeValue, onPnlResolved }: PnlActionProps) {
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const publicDecrypt = usePublicDecrypt();
  const [isWorking, setIsWorking] = useState(false);
  const [pnlValue, setPnlValue] = useState<bigint | null>(null);

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
  const isBusy = isWorking || publicDecrypt.isPending;
  const canCalculatePnl = stakeValue !== undefined;

  useEffect(() => {
    setPnlValue(null);
  }, [marketId, outcome, stakeValue]);

  const updatePnl = async () => {
    if (stakeValue === undefined) {
      toast.error("Decrypt this position before updating PNL.");
      return;
    }
    if (!marketContract || marketId === undefined) {
      toast.error("This market is missing an on-chain ID.");
      return;
    }
    if (chainId !== sepolia.id) {
      toast.error("Switch your wallet to Sepolia before updating PNL.");
      return;
    }

    try {
      setIsWorking(true);
      const hash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "requestPnLUpdate",
        args: [marketId, outcome],
        chainId: sepolia.id,
        gas: 8_000_000n,
      });
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: sepolia.id });
      const [pnlEvent] = parseEventLogs({
        abi: marketContract.abi,
        eventName: "PnLUpdated",
        logs: receipt.logs,
      });

      const numeratorHandle = pnlEvent?.args?.numeratorHandle;
      const denominatorHandle = pnlEvent?.args?.denominatorHandle;
      if (!numeratorHandle || !denominatorHandle) {
        throw new Error("PNL update event was not found in the transaction receipt.");
      }

      const decrypted = await publicDecrypt.mutateAsync([numeratorHandle, denominatorHandle]);
      const numerator = decrypted.clearValues[numeratorHandle];
      const denominator = decrypted.clearValues[denominatorHandle];
      if (typeof numerator !== "bigint" || typeof denominator !== "bigint" || denominator === 0n) {
        throw new Error("Unable to decrypt a valid PNL quote.");
      }

      const fairValue = numerator / denominator;
      const pnl = fairValue - stakeValue;
      setPnlValue(pnl);
      onPnlResolved?.(Number(formatUnits(pnl, 6)));
      toast.success("PNL quote updated.");
    } catch (error) {
      toast.error(toErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  if (!isOpen || !marketId || !hasContract) {
    return <span className="font-mono">{pnlValue === null ? "+0 cUSDT" : formatSignedAmount(pnlValue)}</span>;
  }

  return (
    <span className="flex flex-col items-start gap-1 md:items-end">
      <span
        className={`font-mono font-semibold ${
          pnlValue === null || pnlValue >= 0n
            ? "text-[#16A34A] dark:text-[#22C55E]"
            : "text-[#DC2626] dark:text-[#EF4444]"
        }`}
      >
        {pnlValue === null ? "+0 cUSDT" : formatSignedAmount(pnlValue)}
      </span>
      <button
        type="button"
        onClick={updatePnl}
        disabled={isBusy || !canCalculatePnl}
        title={canCalculatePnl ? "Update PNL" : "Decrypt this position first"}
        className="smooth-action h-7 rounded-md border border-[#E5E5E5] px-2 text-[11px] font-semibold text-[#525252] disabled:cursor-not-allowed disabled:opacity-60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
      >
        {isBusy ? "Updating" : "Update PNL"}
      </button>
    </span>
  );
}
