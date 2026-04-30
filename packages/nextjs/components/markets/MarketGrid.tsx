"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { type CategoryFilter, CategoryTabs } from "~~/components/markets/CategoryTabs";
import { MarketCard } from "~~/components/markets/MarketCard";
import { useProfile } from "~~/components/profile/ProfileContext";
import { getAllMarkets, getCreatorMarkets, getMyCreatorMarkets } from "~~/lib/localMarkets";
import { type Market } from "~~/lib/mockMarkets";

type MarketGridProps = {
  source?: "platform" | "creator";
};

export const MarketGrid = ({ source = "platform" }: MarketGridProps) => {
  const { profileName, walletAddress } = useProfile();
  const [filter, setFilter] = useState<CategoryFilter>(source === "creator" ? "all" : "trending");
  const [creatorTab, setCreatorTab] = useState<"all" | "mine">("all");
  const [markets, setMarkets] = useState<Market[]>([]);
  const isCreatorMarketView = source === "creator";
  const creatorKey = walletAddress || profileName;

  useEffect(() => {
    const syncMarkets = () =>
      setMarkets(
        isCreatorMarketView
          ? creatorTab === "mine"
            ? getMyCreatorMarkets(creatorKey)
            : getCreatorMarkets()
          : getAllMarkets(),
      );

    syncMarkets();
    window.addEventListener("local-markets-updated", syncMarkets);
    window.addEventListener("storage", syncMarkets);

    return () => {
      window.removeEventListener("local-markets-updated", syncMarkets);
      window.removeEventListener("storage", syncMarkets);
    };
  }, [creatorKey, creatorTab, isCreatorMarketView]);

  const visible = useMemo(() => {
    if (filter === "all") return markets;
    if (filter === "trending") return markets.filter(m => m.trending);
    return markets.filter(m => m.category === filter);
  }, [filter, markets]);

  return (
    <section className="px-6 py-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
            {isCreatorMarketView ? "Creator Markets" : "Markets"}
          </h1>
          <p className="mt-1 text-sm text-[#525252] dark:text-[#A1A1A1]">
            {isCreatorMarketView
              ? "Community-created markets awaiting approval or live with 1% fees to creators."
              : "Bet sizes and sides stay encrypted on-chain."}
          </p>
        </div>
        {!isCreatorMarketView && (
          <Link
            href="/admin-market-requests"
            className="smooth-action inline-flex h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] px-4 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
          >
            <ShieldCheck size={16} />
            Admin Demo
          </Link>
        )}
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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {visible.map(market => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-sm text-[#525252] dark:text-[#A1A1A1]">
          {creatorTab === "mine"
            ? "You have not created any markets yet."
            : "No markets in this category yet. Check back soon."}
        </div>
      )}
    </section>
  );
};
