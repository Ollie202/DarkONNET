"use client";

import { useAccount } from "wagmi";
import { ConnectGate } from "~~/components/markets/ConnectGate";
import { MarketGrid } from "~~/components/markets/MarketGrid";

export default function Home() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <ConnectGate />;
  }

  return <MarketGrid />;
}
