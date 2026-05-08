"use client";

import { useCallback, useEffect, useState } from "react";
import { usePublicDecrypt } from "@zama-fhe/react-sdk";
import { usePublicClient } from "wagmi";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";
import { predictionMarketFromBlock } from "~~/utils/predictionMarketDeployment";

type PoolSnapshot = {
  yes: bigint;
  no: bigint;
};

type SnapshotSource = "event" | "fresh";
type FheHandle = `0x${string}`;

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);

const toProbability = (yesPool: bigint, noPool: bigint) => {
  const totalPool = yesPool + noPool;
  if (totalPool === 0n) return 0.5;
  return Math.min(0.99, Math.max(0.01, Number(yesPool) / Number(totalPool)));
};

export const useOnchainOddsSnapshot = ({
  marketId,
  enabled = true,
}: {
  marketId?: string | bigint;
  enabled?: boolean;
}) => {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { mutateAsync: publicDecryptAsync, isPending: isPublicDecrypting } = usePublicDecrypt();
  const [probability, setProbability] = useState<number | null>(null);
  const [poolSnapshot, setPoolSnapshot] = useState<PoolSnapshot | null>(null);
  const [source, setSource] = useState<SnapshotSource | null>(null);
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const normalizedMarketId = (() => {
    if (marketId === undefined || marketId === "") return undefined;
    try {
      return BigInt(marketId);
    } catch {
      return undefined;
    }
  })();

  const applySnapshotHandles = useCallback(
    async (yesPoolHandle: FheHandle, noPoolHandle: FheHandle, nextSource: SnapshotSource = "fresh") => {
      const decrypted = await publicDecryptAsync([yesPoolHandle, noPoolHandle]);
      const yesPool = decrypted.clearValues[yesPoolHandle];
      const noPool = decrypted.clearValues[noPoolHandle];
      if (typeof yesPool !== "bigint" || typeof noPool !== "bigint") {
        throw new Error("Unable to decrypt pool snapshot.");
      }

      setPoolSnapshot({ yes: yesPool, no: noPool });
      setProbability(toProbability(yesPool, noPool));
      setSource(nextSource);
      setError(null);
    },
    [publicDecryptAsync],
  );

  const clearSnapshot = useCallback(() => {
    setProbability(null);
    setPoolSnapshot(null);
    setSource(null);
    setLatestBlock(null);
  }, []);

  const loadLatestSnapshot = useCallback(async () => {
    if (!enabled || !marketContract || !publicClient || normalizedMarketId === undefined) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [yesPoolHandle, noPoolHandle] = await publicClient.readContract({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "getPoolHandles",
        args: [normalizedMarketId],
      });

      if (typeof yesPoolHandle !== "string" || typeof noPoolHandle !== "string") {
        clearSnapshot();
        return;
      }

      await applySnapshotHandles(yesPoolHandle as FheHandle, noPoolHandle as FheHandle, "fresh");
      setLatestBlock(null);
    } catch (caught) {
      try {
        const logs = await publicClient.getContractEvents({
          address: marketContract.address,
          abi: marketContract.abi,
          eventName: "PoolSnapshotRequested",
          args: { marketId: normalizedMarketId },
          fromBlock: predictionMarketFromBlock,
          toBlock: "latest",
        });

        const latestLog = logs
          .slice()
          .sort((a, b) => {
            const blockDiff = Number((a.blockNumber ?? 0n) - (b.blockNumber ?? 0n));
            if (blockDiff !== 0) return blockDiff;
            return (a.logIndex ?? 0) - (b.logIndex ?? 0);
          })
          .at(-1);

        const yesPoolHandle = latestLog?.args?.yesPoolHandle;
        const noPoolHandle = latestLog?.args?.noPoolHandle;
        if (typeof yesPoolHandle !== "string" || typeof noPoolHandle !== "string") {
          clearSnapshot();
          return;
        }

        await applySnapshotHandles(yesPoolHandle as FheHandle, noPoolHandle as FheHandle, "event");
        setLatestBlock(latestLog?.blockNumber ?? null);
      } catch {
        clearSnapshot();
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [applySnapshotHandles, clearSnapshot, enabled, normalizedMarketId, publicClient]);

  useEffect(() => {
    loadLatestSnapshot();
  }, [loadLatestSnapshot]);

  return {
    applySnapshotHandles,
    clearSnapshot,
    error,
    isDecrypting: isPublicDecrypting,
    isLoading,
    latestBlock,
    loadLatestSnapshot,
    poolSnapshot,
    probability,
    source,
  };
};
