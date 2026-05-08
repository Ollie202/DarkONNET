"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicDecrypt } from "@zama-fhe/react-sdk";
import { usePublicClient } from "wagmi";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { type Market } from "~~/lib/mockMarkets";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

type FheHandle = `0x${string}`;
export type OnchainPoolSnapshot = {
  yes: bigint;
  no: bigint;
};

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);
const INITIAL_DECRYPT_DELAY_MS = 1_500;
const DECRYPT_BATCH_SIZE = 12;

const toProbability = (yesPool: bigint, noPool: bigint) => {
  const totalPool = yesPool + noPool;
  if (totalPool === 0n) return 0.5;
  return Math.min(0.99, Math.max(0.01, Number(yesPool) / Number(totalPool)));
};

export const useOnchainMarketVolumes = (markets: Market[], enabled = true) => {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { mutateAsync: publicDecryptAsync } = usePublicDecrypt();
  const [volumesByMarketId, setVolumesByMarketId] = useState<Record<string, bigint>>({});
  const [poolSnapshotsByMarketId, setPoolSnapshotsByMarketId] = useState<Record<string, OnchainPoolSnapshot>>({});
  const [probabilitiesByMarketId, setProbabilitiesByMarketId] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const marketKeys = useMemo(
    () =>
      markets
        .map(market => `${market.id}:${market.onchainMarketId || ""}`)
        .sort()
        .join("|"),
    [markets],
  );

  useEffect(() => {
    let active = true;
    let timeoutId: number | undefined;

    const waitForInitialIdle = () =>
      new Promise<void>(resolve => {
        const idleCallback = window.requestIdleCallback;
        if (idleCallback) {
          idleCallback(() => resolve(), { timeout: INITIAL_DECRYPT_DELAY_MS });
          return;
        }
        timeoutId = window.setTimeout(resolve, INITIAL_DECRYPT_DELAY_MS);
      });

    const yieldToBrowser = () => new Promise<void>(resolve => window.setTimeout(resolve, 0));

    const loadVolumes = async () => {
      if (!enabled || !marketContract || !publicClient || markets.length === 0) {
        setVolumesByMarketId({});
        setPoolSnapshotsByMarketId({});
        setProbabilitiesByMarketId({});
        setIsLoading(false);
        return;
      }

      const onchainMarkets = markets
        .map(market => {
          try {
            return market.onchainMarketId ? { market, onchainMarketId: BigInt(market.onchainMarketId) } : null;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is { market: Market; onchainMarketId: bigint } => Boolean(entry));

      if (onchainMarkets.length === 0) {
        setVolumesByMarketId({});
        setPoolSnapshotsByMarketId({});
        setProbabilitiesByMarketId({});
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await waitForInitialIdle();
        if (!active) return;

        const nextVolumes: Record<string, bigint> = {};
        const nextSnapshots: Record<string, OnchainPoolSnapshot> = {};
        const nextProbabilities: Record<string, number> = {};
        const handlePairs: {
          market: Market;
          yesPoolHandle: FheHandle;
          noPoolHandle: FheHandle;
        }[] = [];

        const poolHandleReads = await publicClient.multicall({
          allowFailure: true,
          contracts: onchainMarkets.map(({ onchainMarketId }) => ({
            address: marketContract.address,
            abi: marketContract.abi,
            functionName: "getPoolHandles",
            args: [onchainMarketId],
          })),
        });

        poolHandleReads.forEach((read, index) => {
          if (read.status !== "success" || !Array.isArray(read.result)) return;
          const [yesPoolHandle, noPoolHandle] = read.result;
          if (typeof yesPoolHandle !== "string" || typeof noPoolHandle !== "string") return;
          handlePairs.push({
            market: onchainMarkets[index].market,
            yesPoolHandle: yesPoolHandle as FheHandle,
            noPoolHandle: noPoolHandle as FheHandle,
          });
        });

        if (handlePairs.length === 0) {
          if (active) {
            setVolumesByMarketId({});
            setPoolSnapshotsByMarketId({});
            setProbabilitiesByMarketId({});
          }
          return;
        }

        for (let index = 0; index < handlePairs.length; index += DECRYPT_BATCH_SIZE) {
          const batch = handlePairs.slice(index, index + DECRYPT_BATCH_SIZE);
          const decrypted = await publicDecryptAsync(batch.flatMap(pair => [pair.yesPoolHandle, pair.noPoolHandle]));
          if (!active) return;

          for (const { market, yesPoolHandle, noPoolHandle } of batch) {
            const yesPool = decrypted.clearValues[yesPoolHandle];
            const noPool = decrypted.clearValues[noPoolHandle];

            if (typeof yesPool === "bigint" && typeof noPool === "bigint") {
              nextSnapshots[market.id] = { yes: yesPool, no: noPool };
              nextVolumes[market.id] = yesPool + noPool;
              nextProbabilities[market.id] = toProbability(yesPool, noPool);
            }
          }

          if (active) {
            setVolumesByMarketId({ ...nextVolumes });
            setPoolSnapshotsByMarketId({ ...nextSnapshots });
            setProbabilitiesByMarketId({ ...nextProbabilities });
          }
          await yieldToBrowser();
        }

        if (active) {
          setVolumesByMarketId(nextVolumes);
          setPoolSnapshotsByMarketId(nextSnapshots);
          setProbabilitiesByMarketId(nextProbabilities);
        }
      } catch {
        if (active) {
          setVolumesByMarketId({});
          setPoolSnapshotsByMarketId({});
          setProbabilitiesByMarketId({});
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadVolumes();

    return () => {
      active = false;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, marketKeys, markets, publicClient, publicDecryptAsync]);

  return { isLoading, poolSnapshotsByMarketId, probabilitiesByMarketId, volumesByMarketId };
};
