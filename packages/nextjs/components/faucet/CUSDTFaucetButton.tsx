"use client";

import { useEffect } from "react";
import { Droplets } from "lucide-react";
import toast from "react-hot-toast";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ConfidentialUSDTFaucet } from "~~/contracts/ConfidentialUSDTFaucet";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

const faucet = deploymentFor(ConfidentialUSDTFaucet, sepolia.id);

const formatCooldown = (seconds: bigint) => {
  const totalSeconds = Number(seconds);
  if (totalSeconds <= 0) {
    return "";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.ceil((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export const CUSDTFaucetButton = () => {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();

  const { data: faucetAmount } = useReadContract({
    address: faucet?.address,
    abi: faucet?.abi,
    functionName: "FAUCET_AMOUNT",
    chainId: sepolia.id,
    query: {
      enabled: Boolean(faucet),
    },
  });

  const {
    data: cooldownData,
    isLoading: isCooldownLoading,
    refetch: refetchCooldown,
  } = useReadContract({
    address: faucet?.address,
    abi: faucet?.abi,
    functionName: "getTimeUntilNextRequest",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(faucet && address),
    },
  });
  const cooldown = typeof cooldownData === "bigint" ? cooldownData : 0n;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: sepolia.id,
  });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    toast.success("cUSDT requested.");
    window.dispatchEvent(new CustomEvent("darkonnet:cusdt-balance-refresh"));
    refetchCooldown();
  }, [isSuccess, refetchCooldown]);

  const requestTokens = async () => {
    if (!faucet) {
      toast.error("cUSDT faucet is not configured for this network.");
      return;
    }

    if (!isConnected) {
      toast.error("Connect your wallet first.");
      return;
    }

    if (cooldown > 0n) {
      toast.error(`Faucet cooldown: ${formatCooldown(cooldown)} remaining.`);
      return;
    }

    try {
      if (chainId !== sepolia.id) {
        toast.error("Switch your wallet to Sepolia to use the faucet.");
        return;
      }

      await writeContractAsync({
        address: faucet.address,
        abi: faucet.abi,
        functionName: "requestTokens",
        chainId: sepolia.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not request cUSDT.";

      if (message.toLowerCase().includes("rejected")) {
        toast.error("Faucet transaction was rejected.");
        return;
      }

      toast.error(message);
    }
  };

  const amountLabel = typeof faucetAmount === "bigint" ? `${formatUnits(faucetAmount, 6)} cUSDT` : "cUSDT";
  const cooldownLabel = cooldown > 0n ? formatCooldown(cooldown) : "";
  const disabled = !faucet || isPending || isConfirming || isCooldownLoading || cooldown > 0n;
  const buttonLabel = isConfirming ? "Confirming" : isPending ? "Requesting" : cooldownLabel ? cooldownLabel : "Faucet";

  return (
    <button
      type="button"
      onClick={requestTokens}
      disabled={disabled}
      title={cooldownLabel ? `Next cUSDT request in ${cooldownLabel}` : `Request ${amountLabel}`}
      className="smooth-action inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#E5E5E5] px-2.5 text-sm font-medium text-[#525252] hover:border-[#FFD60A]/60 hover:bg-[#F4F4F5] hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A] sm:px-3"
    >
      <Droplets size={16} />
      <span className="hidden sm:inline">{buttonLabel}</span>
    </button>
  );
};
