"use client";

import { useMemo, useState } from "react";
import { usePublicDecrypt } from "@zama-fhe/react-sdk";
import toast from "react-hot-toast";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

type ClaimActionProps = {
  isCompleted: boolean;
  onchainMarketId?: string;
  onSettled?: () => void;
};

type PendingClaim = readonly [bigint, `0x${string}`, `0x${string}`, boolean];

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);
const CHAIN_READ_STALE_MS = 60_000;

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to process the claim transaction.";

export function ClaimAction({ isCompleted, onchainMarketId, onSettled }: ClaimActionProps) {
  const { address, isConnected } = useAccount();
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

  const claimedRead = useReadContract({
    address: marketContract?.address,
    abi: marketContract?.abi,
    functionName: "hasClaimed",
    args: marketId && address ? [marketId, address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(hasContract && isConnected && address && marketId),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: CHAIN_READ_STALE_MS,
    },
  });

  const pendingRead = useReadContract({
    address: marketContract?.address,
    abi: marketContract?.abi,
    functionName: "pendingClaims",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(hasContract && isConnected && address),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: CHAIN_READ_STALE_MS,
    },
  });

  const pendingClaim = pendingRead.data as PendingClaim | undefined;
  const pendingExists = Boolean(pendingClaim?.[3]);
  const pendingMarketId = pendingClaim?.[0];
  const hasPendingForThisMarket = Boolean(pendingExists && marketId !== undefined && pendingMarketId === marketId);
  const hasPendingForAnotherMarket = Boolean(pendingExists && marketId !== undefined && pendingMarketId !== marketId);
  const isClaimed = Boolean(claimedRead.data);
  const isBusy = isWorking || publicDecrypt.isPending || claimedRead.isLoading || pendingRead.isLoading;

  const refresh = async () => {
    await Promise.all([claimedRead.refetch(), pendingRead.refetch()]);
    onSettled?.();
  };

  const requestClaim = async () => {
    if (!marketContract || marketId === undefined) {
      toast.error("This market is missing an on-chain ID.");
      return;
    }
    if (chainId !== sepolia.id) {
      toast.error("Switch your wallet to Sepolia before requesting a claim.");
      return;
    }

    try {
      setIsWorking(true);
      const hash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "requestClaim",
        args: [marketId],
        chainId: sepolia.id,
        gas: 8_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash, chainId: sepolia.id });
      toast.success("Claim requested. Payout handles are ready to decrypt.");
      await refresh();
    } catch (error) {
      toast.error(toErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  const fulfillClaim = async () => {
    if (!marketContract || !pendingClaim || !hasPendingForThisMarket) {
      return;
    }
    if (chainId !== sepolia.id) {
      toast.error("Switch your wallet to Sepolia before fulfilling this payout.");
      return;
    }

    try {
      setIsWorking(true);
      const [, numeratorHandle, denominatorHandle] = pendingClaim;
      const decrypted = await publicDecrypt.mutateAsync([numeratorHandle, denominatorHandle]);
      const hash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "fulfillClaim",
        args: [decrypted.abiEncodedClearValues, decrypted.decryptionProof],
        chainId: sepolia.id,
        gas: 8_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash, chainId: sepolia.id });
      window.dispatchEvent(new Event("darkonnet:cusdt-balance-refresh"));
      toast.success("Payout claimed.");
      await refresh();
    } catch (error) {
      toast.error(toErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  if (!isCompleted) {
    return (
      <button
        type="button"
        disabled
        className="h-9 w-full rounded-md border border-[#E5E5E5] px-3 text-xs font-semibold text-[#A1A1A1] opacity-70 dark:border-[#1F1F1F] md:w-auto"
      >
        Unsettled
      </button>
    );
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

  if (isClaimed) {
    return (
      <button
        type="button"
        disabled
        className="h-9 w-full rounded-md border border-[#16A34A]/30 px-3 text-xs font-semibold text-[#16A34A] opacity-80 md:w-auto"
      >
        Claimed
      </button>
    );
  }

  if (hasPendingForAnotherMarket) {
    return (
      <button
        type="button"
        disabled
        title={`Finish market ${pendingMarketId?.toString()} first`}
        className="h-9 w-full rounded-md border border-[#E5E5E5] px-3 text-xs font-semibold text-[#A1A1A1] opacity-70 dark:border-[#1F1F1F] md:w-auto"
      >
        Claim Pending
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={hasPendingForThisMarket ? fulfillClaim : requestClaim}
      disabled={isBusy}
      className="smooth-action h-9 w-full rounded-md bg-[#FFD60A] px-3 text-xs font-semibold text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
    >
      {isBusy ? "Processing" : hasPendingForThisMarket ? "Fulfill Payout" : "Request Claim"}
    </button>
  );
}
