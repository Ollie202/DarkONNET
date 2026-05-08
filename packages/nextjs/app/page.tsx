"use client";
import { Suspense } from "react";
import { MarketGrid } from "~~/components/markets/MarketGrid";

export default function Home() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-[#525252] dark:text-[#A1A1A1] sm:py-16">Initializing dashboard...</div>}>
      <MarketGrid />
    </Suspense>
  );
}

