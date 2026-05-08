"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAllow, useIsAllowed, usePublicDecrypt, useUserDecrypt } from "@zama-fhe/react-sdk";
import { ZERO_HANDLE } from "@zama-fhe/sdk";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { darkonnetApi } from "~~/lib/darkonnetApi";
import { type Market, isMarketEnded } from "~~/lib/mockMarkets";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

export type ChainPositionStatus = "open" | "closed" | "completed";

export type ChainPosition = {
  id: string;
  marketId: string;
  onchainMarketId?: string;
  market: string;
  status: ChainPositionStatus;
  side: "Yes" | "No";
  outcome: 0 | 1;
  stake: string;
  stakeValue?: bigint;
  entry: string;
  current: string;
  pnl: number;
  href: string;
  handle?: `0x${string}`;
  isEncrypted: boolean;
  isExitPending?: boolean;
  isWinningPosition?: boolean;
  isCanceledMarket?: boolean;
  hasMetadata: boolean;
};

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);
const CHAIN_READ_STALE_MS = 60_000;

const formatStake = (value: bigint) => `${formatUnits(value, 6)} cUSDT`;

type MarketInfo = readonly [bigint, string, string, bigint, boolean, number, boolean, boolean];
export type PendingExit = readonly [bigint, number, `0x${string}`, `0x${string}`, `0x${string}`, boolean];
type PoolSnapshot = {
  yes: bigint;
  no: bigint;
};

const toPositionStatus = (market?: Market, marketInfo?: MarketInfo): ChainPositionStatus => {
  if (marketInfo?.[4]) {
    return "completed";
  }

  if (market?.status === "resolved") {
    return "completed";
  }

  if (market?.status === "declined" || (market?.endsAt && isMarketEnded(market.endsAt))) {
    return "closed";
  }

  return "open";
};

const toCurrentLabel = (market?: Market, marketInfo?: MarketInfo) => {
  if (marketInfo?.[6]) {
    return "Canceled";
  }

  if (marketInfo?.[4]) {
    return marketInfo[5] === 0 ? "Winner Yes" : "Winner No";
  }

  return market?.status === "declined" ? "Declined" : "Live";
};

const getWinningOutcome = (market?: Market, marketInfo?: MarketInfo) => {
  if (marketInfo?.[4]) {
    return marketInfo[5] === 0 ? 0 : 1;
  }

  if (market?.resolution === "yes") {
    return 0;
  }

  if (market?.resolution === "no") {
    return 1;
  }

  return undefined;
};

const isCanceled = (market?: Market, marketInfo?: MarketInfo) =>
  Boolean(marketInfo?.[6] || market?.resolution === "canceled");

const formatEntry = (market: Market | undefined, side: "Yes" | "No") => {
  if (!market) return "-";
  return side === "Yes"
    ? `${Math.round(market.yesProbability * 100)}%`
    : `${Math.round((1 - market.yesProbability) * 100)}%`;
};

export const useMarketPositions = () => {
  const { address, isConnected } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketsError, setMarketsError] = useState<Error | null>(null);
  const [decryptRequested, setDecryptRequested] = useState(false);
  const [decryptEnabled, setDecryptEnabled] = useState(false);
  const [poolSnapshotsById, setPoolSnapshotsById] = useState<Record<string, PoolSnapshot>>({});
  const { mutateAsync: publicDecryptAsync, isPending: isPublicDecrypting } = usePublicDecrypt();

  const hasContract = Boolean(marketContract?.address && marketContract?.abi);
  const walletKey = address?.toLowerCase();

  const refreshMarkets = useCallback(async () => {
    try {
      setMarketsError(null);
      setMarkets(await darkonnetApi.listMarkets({ includeEnded: true }));
    } catch (error) {
      setMarketsError(error instanceof Error ? error : new Error("Unable to load markets."));
    }
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setMarkets([]);
      return;
    }

    refreshMarkets();
  }, [isConnected, refreshMarkets]);

  const positionMarkets = useMemo(() => {
    if (!walletKey) return [];
    const walletMarkets = markets.filter(market =>
      market.participantWallets?.some(participant => participant.toLowerCase() === walletKey),
    );

    return walletMarkets;
  }, [markets, walletKey]);

  const marketByOnchainId = useMemo(() => {
    const entries = new Map<string, Market>();
    positionMarkets.forEach(market => {
      if (market.onchainMarketId) {
        entries.set(market.onchainMarketId, market);
      }
    });
    return entries;
  }, [positionMarkets]);

  const targetMarketIds = useMemo(
    () => positionMarkets.map(market => market.onchainMarketId).filter((id): id is string => Boolean(id)),
    [positionMarkets],
  );

  const positionTargets = useMemo(
    () =>
      targetMarketIds.flatMap(onchainMarketId => [
        { onchainMarketId, market: marketByOnchainId.get(onchainMarketId), outcome: 0 as const, side: "Yes" as const },
        { onchainMarketId, market: marketByOnchainId.get(onchainMarketId), outcome: 1 as const, side: "No" as const },
      ]),
    [marketByOnchainId, targetMarketIds],
  );

  const marketInfoTargets = targetMarketIds;

  const marketInfoReads = useReadContracts({
    allowFailure: true,
    contracts: marketInfoTargets.map(onchainMarketId => ({
      address: marketContract?.address,
      abi: marketContract?.abi,
      functionName: "getMarketInfo",
      args: [BigInt(onchainMarketId)],
      chainId: sepolia.id,
    })),
    query: {
      enabled: Boolean(hasContract && isConnected && marketInfoTargets.length > 0),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: CHAIN_READ_STALE_MS,
    },
  });

  const pendingExitRead = useReadContract({
    address: marketContract?.address,
    abi: marketContract?.abi,
    functionName: "pendingExits",
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

  const marketInfoById = useMemo(() => {
    const entries = new Map<string, MarketInfo>();

    marketInfoTargets.forEach((onchainMarketId, index) => {
      const result = marketInfoReads.data?.[index];
      if (result?.status === "success" && Array.isArray(result.result)) {
        entries.set(onchainMarketId, result.result as unknown as MarketInfo);
      }
    });

    return entries;
  }, [marketInfoReads.data, marketInfoTargets]);

  const positionReads = useReadContracts({
    allowFailure: true,
    contracts: positionTargets.map(target => ({
      address: marketContract?.address,
      abi: marketContract?.abi,
      functionName: "getMyPosition",
      args: [BigInt(target.onchainMarketId), target.outcome],
      chainId: sepolia.id,
      account: address,
    })),
    query: {
      enabled: Boolean(hasContract && isConnected && address && positionTargets.length > 0),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: CHAIN_READ_STALE_MS,
    },
  });

  const encryptedPositions = useMemo(() => {
    const results = positionReads.data ?? [];

    return positionTargets
      .map((target, index) => {
        const result = results[index];
        const handle = result?.status === "success" && typeof result.result === "string" ? result.result : undefined;

        if (!handle || handle === ZERO_HANDLE) {
          return null;
        }

        return {
          target,
          handle: handle as `0x${string}`,
        };
      })
      .filter((position): position is NonNullable<typeof position> => Boolean(position));
  }, [positionReads.data, positionTargets]);

  const tokenAddress = (marketContract?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const { data: isAllowed } = useIsAllowed({ contractAddresses: [tokenAddress] });
  const { mutate: allow, isPending: isAllowing } = useAllow();

  const completedPayoutMarketIds = useMemo(() => {
    const ids = new Set<string>();

    encryptedPositions.forEach(({ target }) => {
      const marketInfo = marketInfoById.get(target.onchainMarketId);
      const isSettled = Boolean(marketInfo?.[4]);
      const isCanceledMarket = isCanceled(target.market, marketInfo);
      const winningOutcome = getWinningOutcome(target.market, marketInfo);

      if (isSettled && !isCanceledMarket && winningOutcome === target.outcome) {
        ids.add(target.onchainMarketId);
      }
    });

    return [...ids];
  }, [encryptedPositions, marketInfoById]);

  const completedPoolReads = useReadContracts({
    allowFailure: true,
    contracts: completedPayoutMarketIds.map(onchainMarketId => ({
      address: marketContract?.address,
      abi: marketContract?.abi,
      functionName: "getPoolHandles",
      args: [BigInt(onchainMarketId)],
      chainId: sepolia.id,
    })),
    query: {
      enabled: Boolean(
        hasContract && isConnected && decryptEnabled && isAllowed && completedPayoutMarketIds.length > 0,
      ),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: CHAIN_READ_STALE_MS,
    },
  });

  const decryptHandles = useMemo(
    () =>
      encryptedPositions.map(position => ({
        handle: position.handle,
        contractAddress: tokenAddress,
      })),
    [encryptedPositions, tokenAddress],
  );

  const decryptedPositions = useUserDecrypt(
    { handles: decryptHandles },
    { enabled: decryptEnabled && Boolean(isAllowed) && decryptHandles.length > 0 },
  );

  useEffect(() => {
    if (decryptRequested && isAllowed) {
      setDecryptEnabled(true);
    }
  }, [decryptRequested, isAllowed]);

  useEffect(() => {
    setDecryptEnabled(false);
    setDecryptRequested(false);
  }, [address, encryptedPositions.length]);

  useEffect(() => {
    let active = true;

    const decryptPools = async () => {
      if (!decryptEnabled || !isAllowed || completedPayoutMarketIds.length === 0) {
        if (active) setPoolSnapshotsById({});
        return;
      }

      const results = completedPoolReads.data ?? [];
      const validPools = completedPayoutMarketIds
        .map((onchainMarketId, index) => {
          const result = results[index];
          const handles = result?.status === "success" ? result.result : undefined;
          if (!Array.isArray(handles)) return null;
          const [yesHandle, noHandle] = handles;
          if (typeof yesHandle !== "string" || typeof noHandle !== "string") return null;
          return {
            onchainMarketId,
            yesHandle: yesHandle as `0x${string}`,
            noHandle: noHandle as `0x${string}`,
          };
        })
        .filter((pool): pool is NonNullable<typeof pool> => Boolean(pool));

      if (validPools.length === 0) {
        if (active) setPoolSnapshotsById({});
        return;
      }

      try {
        const decrypted = await publicDecryptAsync(validPools.flatMap(pool => [pool.yesHandle, pool.noHandle]));
        const snapshots = validPools.reduce<Record<string, PoolSnapshot>>((next, pool) => {
          const yes = decrypted.clearValues[pool.yesHandle];
          const no = decrypted.clearValues[pool.noHandle];
          if (typeof yes === "bigint" && typeof no === "bigint") {
            next[pool.onchainMarketId] = { yes, no };
          }
          return next;
        }, {});

        if (active) setPoolSnapshotsById(snapshots);
      } catch {
        if (active) setPoolSnapshotsById({});
      }
    };

    decryptPools();

    return () => {
      active = false;
    };
  }, [completedPayoutMarketIds, completedPoolReads.data, decryptEnabled, isAllowed, publicDecryptAsync]);

  const decrypt = useCallback(() => {
    if (!hasContract || encryptedPositions.length === 0) {
      return;
    }

    setDecryptRequested(true);
    if (!isAllowed) {
      allow([tokenAddress]);
      return;
    }

    setDecryptEnabled(true);
  }, [allow, encryptedPositions.length, hasContract, isAllowed, tokenAddress]);

  const positions = useMemo<ChainPosition[]>(() => {
    const activePositions = encryptedPositions.map(({ target, handle }) => {
      const decryptedValue = decryptedPositions.data?.[handle];
      const stake = typeof decryptedValue === "bigint" ? formatStake(decryptedValue) : "Encrypted";
      const marketInfo = marketInfoById.get(target.onchainMarketId);
      const marketId = target.market?.id ?? `chain-${target.onchainMarketId}`;
      const isCanceledMarket = isCanceled(target.market, marketInfo);
      const winningOutcome = getWinningOutcome(target.market, marketInfo);
      const isWinningPosition = isCanceledMarket || winningOutcome === target.outcome;
      const poolSnapshot = poolSnapshotsById[target.onchainMarketId];
      const resolvedPnl = (() => {
        if (typeof decryptedValue !== "bigint" || !marketInfo?.[4]) return 0;
        if (isCanceledMarket) return 0;
        if (winningOutcome !== target.outcome) return -Number(formatUnits(decryptedValue, 6));
        const winningPool = winningOutcome === 0 ? poolSnapshot?.yes : poolSnapshot?.no;
        const totalPool = poolSnapshot && poolSnapshot.yes + poolSnapshot.no;
        if (!winningPool || !totalPool || winningPool === 0n) return 0;
        const payout = (decryptedValue * totalPool) / winningPool;
        return Number(formatUnits(payout - decryptedValue, 6));
      })();

      return {
        id: `${marketId}-${target.side.toLowerCase()}`,
        marketId,
        onchainMarketId: target.onchainMarketId,
        market: target.market?.question ?? `On-chain market #${target.onchainMarketId}`,
        status: toPositionStatus(target.market, marketInfo),
        side: target.side,
        outcome: target.outcome,
        stake,
        stakeValue: typeof decryptedValue === "bigint" ? decryptedValue : undefined,
        entry: formatEntry(target.market, target.side),
        current: toCurrentLabel(target.market, marketInfo),
        pnl: resolvedPnl,
        href: target.market ? `/markets/${target.market.slug || target.market.id}` : "",
        handle,
        isEncrypted: typeof decryptedValue !== "bigint",
        isWinningPosition,
        isCanceledMarket,
        hasMetadata: Boolean(target.market),
      };
    });

    const pendingExit = pendingExitRead.data as PendingExit | undefined;
    if (!pendingExit?.[5]) {
      return activePositions;
    }

    const [pendingMarketId, pendingOutcome] = pendingExit;
    const pendingOnchainMarketId = pendingMarketId.toString();
    const pendingMarket = marketByOnchainId.get(pendingOnchainMarketId);
    const pendingSide = pendingOutcome === 0 ? "Yes" : "No";
    const hasActivePendingRow = activePositions.some(
      position => position.onchainMarketId === pendingOnchainMarketId && position.outcome === pendingOutcome,
    );

    if (hasActivePendingRow) {
      return activePositions;
    }

    const pendingMetadataId = pendingMarket?.id ?? `chain-${pendingOnchainMarketId}`;
    return [
      ...activePositions,
      {
        id: `${pendingMetadataId}-${pendingSide.toLowerCase()}-exit-pending`,
        marketId: pendingMetadataId,
        onchainMarketId: pendingOnchainMarketId,
        market: pendingMarket?.question ?? `On-chain market #${pendingOnchainMarketId}`,
        status: "open",
        side: pendingSide,
        outcome: pendingOutcome === 0 ? 0 : 1,
        stake: "Exit pending",
        stakeValue: undefined,
        entry: formatEntry(pendingMarket, pendingSide),
        current: toCurrentLabel(pendingMarket, marketInfoById.get(pendingOnchainMarketId)),
        pnl: 0,
        href: pendingMarket ? `/markets/${pendingMarket.slug || pendingMarket.id}` : "",
        isEncrypted: false,
        isExitPending: true,
        isWinningPosition: false,
        isCanceledMarket: isCanceled(pendingMarket, marketInfoById.get(pendingOnchainMarketId)),
        hasMetadata: Boolean(pendingMarket),
      },
    ];
  }, [
    decryptedPositions.data,
    encryptedPositions,
    marketByOnchainId,
    marketInfoById,
    pendingExitRead.data,
    poolSnapshotsById,
  ]);

  return {
    decrypt,
    error:
      positionReads.error ||
      marketInfoReads.error ||
      pendingExitRead.error ||
      completedPoolReads.error ||
      decryptedPositions.error,
    hasEncryptedPositions: encryptedPositions.length > 0,
    isAllowing,
    isDecrypting: decryptedPositions.isFetching || isPublicDecrypting,
    isLoading:
      positionReads.isLoading || marketInfoReads.isLoading || pendingExitRead.isLoading || completedPoolReads.isLoading,
    isPendingExitLoading: pendingExitRead.isLoading,
    isReady: positionReads.isSuccess,
    metadataError: marketsError,
    pendingExit: pendingExitRead.data as PendingExit | undefined,
    positions,
    refresh: async () => {
      await refreshMarkets();
      await positionReads.refetch();
      await marketInfoReads.refetch();
      if (completedPayoutMarketIds.length > 0) {
        await completedPoolReads.refetch();
      }
      await pendingExitRead.refetch();
      setDecryptEnabled(false);
      setDecryptRequested(false);
    },
  };
};
