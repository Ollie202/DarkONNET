"use client";

import { useAccount } from "wagmi";
import { ConnectGate } from "~~/components/markets/ConnectGate";
import { MarketGrid } from "~~/components/markets/MarketGrid";

export default function CreatorMarketsPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <ConnectGate />;
  }

  return <MarketGrid source="creator" />;
}
