"use client";

import { useSearchParams } from "next/navigation";
import { MarketDetailResolver } from "~~/components/markets/MarketDetailResolver";

export const MarketDetailQueryResolver = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  if (!id) {
    return (
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-lg border border-[#E5E5E5] bg-white p-6 dark:border-[#1F1F1F] dark:bg-[#141414]">
          <h1 className="text-xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Market Not Found</h1>
          <p className="mt-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
            This market link is missing an event ID.
          </p>
        </div>
      </section>
    );
  }

  return <MarketDetailResolver id={id} />;
};
