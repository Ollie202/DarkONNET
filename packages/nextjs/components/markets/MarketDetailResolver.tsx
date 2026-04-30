"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketDetail } from "~~/components/markets/MarketDetail";
import { getLocalMarketById } from "~~/lib/localMarkets";
import { type Market } from "~~/lib/mockMarkets";

type MarketDetailResolverProps = {
  id: string;
  initialMarket?: Market;
};

export const MarketDetailResolver = ({ id, initialMarket }: MarketDetailResolverProps) => {
  const [market, setMarket] = useState<Market | undefined>(initialMarket);
  const [loaded, setLoaded] = useState(Boolean(initialMarket));

  useEffect(() => {
    setMarket(initialMarket ?? getLocalMarketById(id));
    setLoaded(true);
  }, [id, initialMarket]);

  if (!loaded) {
    return <div className="px-6 py-10 text-sm text-[#525252] dark:text-[#A1A1A1]">Loading market...</div>;
  }

  if (!market) {
    return (
      <section className="px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-lg border border-[#E5E5E5] bg-white p-6 dark:border-[#1F1F1F] dark:bg-[#141414]">
          <h1 className="text-xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Market Not Found</h1>
          <p className="mt-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
            This market may not exist in local storage yet, or it may have been removed.
          </p>
          <Link
            href="/"
            className="smooth-action mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#FFD60A] px-4 text-sm font-semibold text-[#0A0A0A]"
          >
            <ArrowLeft size={16} />
            Back To Markets
          </Link>
        </div>
      </section>
    );
  }

  return <MarketDetail market={market} />;
};
