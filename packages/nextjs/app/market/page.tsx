import { Suspense } from "react";
import { MarketDetailQueryResolver } from "~~/components/markets/MarketDetailQueryResolver";

export default function MarketPage() {
  return (
    <Suspense
      fallback={<div className="px-4 py-10 text-sm text-[#525252] dark:text-[#A1A1A1] sm:px-6">Loading market...</div>}
    >
      <MarketDetailQueryResolver />
    </Suspense>
  );
}
