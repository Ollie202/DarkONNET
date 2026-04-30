"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowUpRight, BarChart3, CheckCircle2, CircleDot, LockKeyhole, XCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { closeLocalPosition, getLocalPositions } from "~~/lib/localPositions";

type PositionStatus = "open" | "closed" | "completed";

type Position = {
  id: string;
  market: string;
  status: PositionStatus;
  side: "Yes" | "No";
  stake: string;
  entry: string;
  current: string;
  pnl: number;
  href: string;
};

const tabs: Array<{ id: PositionStatus; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "open", label: "Open", icon: CircleDot },
  { id: "closed", label: "Closed", icon: XCircle },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const positions: Position[] = [
  {
    id: "pos-1",
    market: "Will the Fed cut rates before the end of summer 2026?",
    status: "open",
    side: "No",
    stake: "20 cUSDT",
    entry: "54%",
    current: "62%",
    pnl: 3.4,
    href: "/markets/fed-cut-summer",
  },
  {
    id: "pos-2",
    market: "Will BTC reach $150k before 2026 ends?",
    status: "open",
    side: "Yes",
    stake: "10 cUSDT",
    entry: "41%",
    current: "36%",
    pnl: -1.12,
    href: "/markets/btc-150k-2026",
  },
  {
    id: "pos-3",
    market: "Will oil trade above $100 before July?",
    status: "closed",
    side: "No",
    stake: "15 cUSDT",
    entry: "48%",
    current: "43%",
    pnl: 1.9,
    href: "/markets/oil-100-june",
  },
  {
    id: "pos-4",
    market: "Will Argentina win the 2026 World Cup?",
    status: "closed",
    side: "Yes",
    stake: "5 cUSDT",
    entry: "18%",
    current: "15%",
    pnl: -0.64,
    href: "/markets/argentina-wc-2026",
  },
  {
    id: "pos-5",
    market: "Will a Red Sea shipping route normalize before Q3?",
    status: "completed",
    side: "No",
    stake: "25 cUSDT",
    entry: "57%",
    current: "Resolved No",
    pnl: 11.25,
    href: "/markets/red-sea-normalizes",
  },
  {
    id: "pos-6",
    market: "Will a Solana ETF be approved in 2026?",
    status: "completed",
    side: "Yes",
    stake: "12 cUSDT",
    entry: "44%",
    current: "Resolved No",
    pnl: -12,
    href: "/markets/sol-etf-2026",
  },
];

const formatPnl = (pnl: number) =>
  `${pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })} cUSDT`;

export default function PositionsPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [activeTab, setActiveTab] = useState<PositionStatus>("open");
  const [allPositions, setAllPositions] = useState<Position[]>(positions);

  useEffect(() => {
    const syncPositions = () => setAllPositions([...getLocalPositions(), ...positions]);

    syncPositions();
    window.addEventListener("local-positions-updated", syncPositions);
    window.addEventListener("storage", syncPositions);

    return () => {
      window.removeEventListener("local-positions-updated", syncPositions);
      window.removeEventListener("storage", syncPositions);
    };
  }, []);

  const visiblePositions = useMemo(
    () => allPositions.filter(position => position.status === activeTab),
    [activeTab, allPositions],
  );
  const totalPnl = visiblePositions.reduce((total, position) => total + position.pnl, 0);

  const closePosition = (positionId: string) => {
    closeLocalPosition(positionId);
    setAllPositions(currentPositions =>
      currentPositions.map(position =>
        position.id === positionId
          ? {
              ...position,
              status: "closed",
              current: position.current.startsWith("Resolved") ? position.current : `${position.current} closed`,
            }
          : position,
      ),
    );
    setActiveTab("closed");
  };

  if (!isConnected) {
    return (
      <section className="px-6 py-6">
        <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-lg border border-[#E5E5E5] bg-white p-6 text-center dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD60A] text-[#0A0A0A]">
              <LockKeyhole size={19} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">My Positions</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
              Connect your wallet to view open, closed, and completed positions tied to your wallet profile.
            </p>
            <button
              type="button"
              onClick={() => openConnectModal?.()}
              className="smooth-action mt-5 h-11 rounded-md bg-[#FFD60A] px-5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">My Positions</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#525252] dark:text-[#A1A1A1]">
              Track your private market exposure, settled results, and per-position PNL.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="flex items-center gap-2 text-xs text-[#525252] dark:text-[#A1A1A1]">
              <LockKeyhole size={14} />
              Tab PNL
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold ${
                totalPnl >= 0 ? "text-[#16A34A] dark:text-[#22C55E]" : "text-[#DC2626] dark:text-[#EF4444]"
              }`}
            >
              {formatPnl(totalPnl)}
            </div>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`smooth-action inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold ${
                  isActive
                    ? "bg-[#FFD60A] text-[#0A0A0A]"
                    : "border border-[#E5E5E5] bg-white text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white dark:border-[#1F1F1F] dark:bg-[#141414]">
          <div className="hidden grid-cols-[minmax(15rem,1fr)_4rem_5.5rem_4.5rem_5.5rem_7rem_7rem] items-center gap-2 border-b border-[#E5E5E5] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#525252] dark:border-[#1F1F1F] dark:text-[#A1A1A1] md:grid">
            <span>Market</span>
            <span className="text-center">Side</span>
            <span className="text-right">Stake</span>
            <span className="text-right">Entry</span>
            <span className="text-right">Current</span>
            <span className="text-right">PNL</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-[#E5E5E5] dark:divide-[#1F1F1F]">
            {visiblePositions.map(position => (
              <div
                key={position.id}
                className="grid gap-3 px-4 py-4 text-sm hover:bg-[#F8FAFC] dark:hover:bg-[#0A0A0A] md:grid-cols-[minmax(15rem,1fr)_4rem_5.5rem_4.5rem_5.5rem_7rem_7rem] md:items-center md:gap-2"
              >
                <span className="min-w-0">
                  <Link
                    href={position.href}
                    className="smooth-action block truncate font-semibold text-[#0A0A0A] hover:text-[#A37500] dark:text-[#FAFAFA] dark:hover:text-[#FFD60A]"
                  >
                    {position.market}
                  </Link>
                  <span className="mt-1 flex items-center gap-1 text-xs text-[#525252] dark:text-[#A1A1A1]">
                    <BarChart3 size={13} />
                    {position.status[0].toUpperCase() + position.status.slice(1)}
                  </span>
                </span>
                <span className={`md:text-center ${position.side === "Yes" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                  <span className="text-[#525252] dark:text-[#A1A1A1] md:hidden">Side: </span>
                  {position.side}
                </span>
                <span className="font-mono text-[#525252] dark:text-[#A1A1A1] md:text-right">
                  <span className="md:hidden">Stake: </span>
                  {position.stake}
                </span>
                <span className="font-mono text-[#525252] dark:text-[#A1A1A1] md:text-right">
                  <span className="md:hidden">Entry: </span>
                  {position.entry}
                </span>
                <span className="font-mono text-[#525252] dark:text-[#A1A1A1] md:text-right">
                  <span className="md:hidden">Current: </span>
                  {position.current}
                </span>
                <span
                  className={`flex items-center justify-start gap-2 font-mono font-semibold md:justify-end ${
                    position.pnl >= 0 ? "text-[#16A34A] dark:text-[#22C55E]" : "text-[#DC2626] dark:text-[#EF4444]"
                  }`}
                >
                  <span className="font-sans font-normal text-[#525252] dark:text-[#A1A1A1] md:hidden">PNL: </span>
                  {formatPnl(position.pnl)}
                  <ArrowUpRight size={14} />
                </span>
                {position.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => closePosition(position.id)}
                    className="smooth-action h-9 w-full cursor-pointer rounded-md border border-[#E5E5E5] px-3 text-xs font-semibold text-[#525252] hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                  >
                    Close Trade
                  </button>
                ) : (
                  <span className="text-right text-xs text-[#525252] dark:text-[#A1A1A1]">-</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
