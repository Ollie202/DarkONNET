"use client";

import { useMemo, useState } from "react";
import { type CategoryFilter, CategoryTabs } from "~~/components/markets/CategoryTabs";
import { MarketCard } from "~~/components/markets/MarketCard";
import { mockMarkets } from "~~/lib/mockMarkets";

export const MarketGrid = () => {
  const [filter, setFilter] = useState<CategoryFilter>("trending");

  const visible = useMemo(() => {
    if (filter === "all") return mockMarkets;
    if (filter === "trending") return mockMarkets.filter(m => m.trending);
    return mockMarkets.filter(m => m.category === filter);
  }, [filter]);

  return (
    <section className="px-6 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Markets</h1>
        <p className="text-sm text-[#525252] dark:text-[#A1A1A1] mt-1">Bet sizes and sides stay encrypted on-chain.</p>
      </header>

      <CategoryTabs active={filter} onChange={setFilter} />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {visible.map(market => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-sm text-[#525252] dark:text-[#A1A1A1]">
          No markets in this category yet. Check back soon.
        </div>
      )}
    </section>
  );
};
