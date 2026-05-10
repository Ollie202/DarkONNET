"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useAccount } from "wagmi";
import { type CategoryFilter, CategoryTabs } from "~~/components/markets/CategoryTabs";
import { MarketCard } from "~~/components/markets/MarketCard";
import { useProfile } from "~~/components/profile/ProfileContext";
import { type OnchainPoolSnapshot, useOnchainMarketVolumes } from "~~/hooks/markets/useOnchainMarketVolumes";
import { mapSupabaseMarketToMarket } from "~~/lib/darkonnetApi";
import { type Market, getMarketVolumeScore, isMarketEnded } from "~~/lib/mockMarkets";
import { createClient } from "~~/utils/supabase/client";

type MarketGridProps = {
  source?: "platform" | "creator";
};

type SportsFilter = "all" | NonNullable<Market["sportType"]>;
type OnchainMarketGridData = {
  poolSnapshotsByMarketId: Record<string, OnchainPoolSnapshot>;
  probabilitiesByMarketId: Record<string, number>;
  volumesByMarketId: Record<string, bigint>;
};

const sportsFilters: { id: SportsFilter; label: string }[] = [
  { id: "all", label: "All Sports" },
  { id: "nfl", label: "NFL" },
  { id: "basketball", label: "Basketball" },
  { id: "football", label: "Football" },
  { id: "formula1", label: "Formula 1" },
];

const emptyOnchainData: OnchainMarketGridData = {
  poolSnapshotsByMarketId: {},
  probabilitiesByMarketId: {},
  volumesByMarketId: {},
};

const isLiveMarket = (market: Market) =>
  market.status !== "pending" &&
  market.status !== "declined" &&
  market.status !== "resolved" &&
  !market.resolution &&
  !isMarketEnded(market.endsAt);

const OnchainMarketDataBridge = ({
  markets,
  onUpdate,
}: {
  markets: Market[];
  onUpdate: (data: OnchainMarketGridData) => void;
}) => {
  const { poolSnapshotsByMarketId, probabilitiesByMarketId, volumesByMarketId } = useOnchainMarketVolumes(markets);

  useEffect(() => {
    onUpdate({ poolSnapshotsByMarketId, probabilitiesByMarketId, volumesByMarketId });
  }, [onUpdate, poolSnapshotsByMarketId, probabilitiesByMarketId, volumesByMarketId]);

  return null;
};

export const MarketGrid = ({ source = "platform" }: MarketGridProps) => {
  const { address, isConnected, status } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { profileName, walletAddress } = useProfile();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derived state from URL
  const filter = (searchParams.get("filter") as CategoryFilter) || (source === "creator" ? "all" : "trending");
  const sportsFilter = (searchParams.get("sport") as SportsFilter) || "all";

  // Actions that update the URL (which updates the derived state)
  const setFilter = (newFilter: CategoryFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    const defaultFilter = source === "creator" ? "all" : "trending";

    if (newFilter === defaultFilter) {
      params.delete("filter");
    } else {
      params.set("filter", newFilter);
    }

    if (newFilter !== filter) {
      params.delete("sport");
    }

    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
  };

  const setSportsFilter = (newSport: SportsFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSport === "all") {
      params.delete("sport");
    } else {
      params.set("sport", newSport);
    }
    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
  };

  const [creatorTab, setCreatorTab] = useState<"all" | "mine">("all");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shouldLoadOnchainData, setShouldLoadOnchainData] = useState(false);
  const [onchainData, setOnchainData] = useState<OnchainMarketGridData>(emptyOnchainData);
  const isCreatorMarketView = source === "creator";
  const isWalletHydrating = !isMounted || status === "reconnecting" || status === "connecting";
  const isWalletConnected = isMounted && isConnected;
  const creatorKey = isWalletConnected ? (address || walletAddress || profileName).toLowerCase() : "";
  const trendingLimit = 6;
  const {
    poolSnapshotsByMarketId: onchainPoolSnapshotsByMarketId,
    probabilitiesByMarketId: onchainProbabilitiesByMarketId,
    volumesByMarketId: onchainVolumesByMarketId,
  } = onchainData;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isCreatorMarketView || !isMounted || isLoading || !isWalletConnected || markets.length === 0) {
      setShouldLoadOnchainData(false);
      if (isCreatorMarketView) setOnchainData(emptyOnchainData);
      return;
    }

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const idleCallback = window.requestIdleCallback;
    if (idleCallback) {
      idleId = idleCallback(() => setShouldLoadOnchainData(true), { timeout: 2_000 });
    } else {
      timeoutId = window.setTimeout(() => setShouldLoadOnchainData(true), 2_000);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [isCreatorMarketView, isLoading, isMounted, markets.length, isWalletConnected]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const syncMarkets = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { data, error: fetchError } = await supabase
          .from("markets")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        if (!active) return;
        setMarkets(data.map(mapSupabaseMarketToMarket));
      } catch (err) {
        if (!active) return;
        setMarkets([]);
        setError("Failed to fetch Markets");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    syncMarkets();

    const channel = supabase
      .channel("markets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "markets" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "INSERT") {
            setMarkets(prev => [mapSupabaseMarketToMarket(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMarkets(prev =>
              prev.map(m => (m.id === payload.new.market_id ? mapSupabaseMarketToMarket(payload.new) : m)),
            );
          } else if (payload.eventType === "DELETE") {
            setMarkets(prev => prev.filter(m => m.id === payload.old.market_id));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const visible = useMemo(() => {
    if (isCreatorMarketView && creatorTab === "mine" && !isWalletConnected) return [];
    const liveMarkets = markets.filter(isLiveMarket);
    const sourceMarkets = isCreatorMarketView
      ? liveMarkets.filter(market => {
          const isAcceptedCreatorMarket = market.status === "open" && Boolean(market.creatorKey);
          if (!isAcceptedCreatorMarket) return false;
          if (creatorTab === "mine") return Boolean(creatorKey) && market.creatorKey?.toLowerCase() === creatorKey;
          return true;
        })
      : liveMarkets;
    if (filter === "all") return sourceMarkets;
    if (filter === "trending") {
      const hasOnchainVolumes = Object.keys(onchainVolumesByMarketId).length > 0;
      const getRankVolume = (market: Market) => {
        const onchainVolume = onchainVolumesByMarketId[market.id];
        if (onchainVolume !== undefined) return Number(onchainVolume);
        return hasOnchainVolumes ? -1 : getMarketVolumeScore(market);
      };
      const rankedMarkets = [...sourceMarkets].sort((a, b) => {
        const volumeDelta = getRankVolume(b) - getRankVolume(a);
        if (volumeDelta !== 0) return volumeDelta;
        return a.question.localeCompare(b.question);
      });
      const hasVolume = rankedMarkets.some(market => getRankVolume(market) > 0);
      return (hasVolume ? rankedMarkets.filter(market => getRankVolume(market) > 0) : rankedMarkets).slice(
        0,
        trendingLimit,
      );
    }
    const categoryMarkets = sourceMarkets.filter(m => m.category === filter);
    if (filter !== "sports" || sportsFilter === "all") return categoryMarkets;
    return categoryMarkets.filter(m => m.sportType === sportsFilter);
  }, [
    creatorKey,
    creatorTab,
    filter,
    isCreatorMarketView,
    isWalletConnected,
    markets,
    onchainVolumesByMarketId,
    sportsFilter,
  ]);

  return (
    <section className="px-4 py-5 sm:px-6 sm:py-6">
      {shouldLoadOnchainData && <OnchainMarketDataBridge markets={markets} onUpdate={setOnchainData} />}

      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
            {isCreatorMarketView ? "Creator Markets" : "Markets"}
          </h1>
          <p className="mt-1 text-sm text-[#525252] dark:text-[#A1A1A1]">
            {isCreatorMarketView
              ? "Community-created markets live with 1% fees to creators."
              : "Bet sizes and sides stay encrypted on-chain."}
          </p>
        </div>
      </header>

      {isCreatorMarketView && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "all" as const, label: "Creator Markets" },
            { id: "mine" as const, label: "My Markets" },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCreatorTab(tab.id)}
              className={`smooth-action h-10 rounded-md px-4 text-sm font-semibold ${
                creatorTab === tab.id
                  ? "bg-[#FFD60A] text-[#0A0A0A]"
                  : "border border-[#E5E5E5] bg-white text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <CategoryTabs active={filter} onChange={setFilter} />

      {filter === "sports" && (
        <div className="mt-4 flex w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex min-w-max rounded-md border border-[#E5E5E5] bg-white p-0.5 dark:border-[#1F1F1F] dark:bg-[#141414]">
            {sportsFilters.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSportsFilter(option.id)}
                className={`smooth-action h-9 rounded-[0.35rem] px-3 text-xs font-semibold sm:px-4 ${
                  sportsFilter === option.id
                    ? "bg-[#FFD60A] text-[#0A0A0A]"
                    : "text-[#525252] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map(market => (
          <MarketCard
            key={market.id}
            market={market}
            onchainPoolSnapshot={onchainPoolSnapshotsByMarketId[market.id]}
            onchainProbability={onchainProbabilitiesByMarketId[market.id]}
            onchainVolume={onchainVolumesByMarketId[market.id]}
          />
        ))}
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-[#525252] dark:text-[#A1A1A1] sm:py-16">Loading Markets...</div>
      )}

      {!isLoading && error && (
        <div className="py-12 text-center text-sm font-semibold text-[#DC2626] sm:py-16">{error}</div>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <div className="py-12 text-center text-sm text-[#525252] dark:text-[#A1A1A1] sm:py-16">
          {creatorTab === "mine" && isWalletHydrating ? (
            "Checking wallet connection..."
          ) : creatorTab === "mine" && !isWalletConnected ? (
            <div className="mx-auto max-w-md rounded-lg border border-[#E5E5E5] bg-white p-5 dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Connect wallet to view My Markets</div>
              <p className="mt-2 leading-6">Creator ownership is tied to your wallet profile.</p>
              <button
                type="button"
                onClick={() => openConnectModal?.()}
                className="smooth-action mt-4 h-10 rounded-md bg-[#FFD60A] px-4 text-sm font-semibold text-[#0A0A0A]"
              >
                Connect Wallet
              </button>
            </div>
          ) : creatorTab === "mine" ? (
            "You have not created any markets yet."
          ) : (
            "No markets are available in this category yet."
          )}
        </div>
      )}
    </section>
  );
};
