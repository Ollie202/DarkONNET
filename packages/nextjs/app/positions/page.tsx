"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ClaimAction } from "~~/components/positions/ClaimAction";
import { ExitAction } from "~~/components/positions/ExitAction";
import { PnlAction } from "~~/components/positions/PnlAction";
import { type ChainPositionStatus, useMarketPositions } from "~~/hooks/markets/useMarketPositions";

const tabs: Array<{ id: ChainPositionStatus; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "open", label: "Open", icon: CircleDot },
  { id: "closed", label: "Closed", icon: XCircle },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const formatPnl = (pnl: number) =>
  `${pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })} cUSDT`;

export default function PositionsPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [activeTab, setActiveTab] = useState<ChainPositionStatus>("open");
  const [pnlByPosition, setPnlByPosition] = useState<Record<string, number>>({});
  const marketPositions = useMarketPositions();
  const allPositions = marketPositions.positions;
  const positionQuoteKey = useMemo(
    () =>
      allPositions
        .map(position => `${position.id}:${position.status}:${position.stakeValue?.toString() ?? "encrypted"}`)
        .join("|"),
    [allPositions],
  );

  const visiblePositions = useMemo(
    () => allPositions.filter(position => position.status === activeTab),
    [activeTab, allPositions],
  );
  const totalPnl = visiblePositions.reduce(
    (total, position) => total + (pnlByPosition[position.id] ?? position.pnl),
    0,
  );

  useEffect(() => {
    const validPositionIds = new Set(
      allPositions.filter(position => position.stakeValue !== undefined).map(position => position.id),
    );

    setPnlByPosition(current => {
      const next = Object.fromEntries(Object.entries(current).filter(([id]) => validPositionIds.has(id)));
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [allPositions, positionQuoteKey]);

  if (!isConnected) {
    return (
      <section className="px-4 py-5 sm:px-6 sm:py-6">
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
    <section className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">My Positions</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#525252] dark:text-[#A1A1A1]">
              Track encrypted market exposure from your wallet&apos;s on-chain positions.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={marketPositions.decrypt}
                disabled={
                  !marketPositions.hasEncryptedPositions || marketPositions.isAllowing || marketPositions.isDecrypting
                }
                className="smooth-action inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#FFD60A] px-4 text-sm font-semibold text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck size={16} />
                {marketPositions.isAllowing
                  ? "Authorizing"
                  : marketPositions.isDecrypting
                    ? "Decrypting"
                    : "Decrypt Positions"}
              </button>
              <button
                type="button"
                onClick={marketPositions.refresh}
                disabled={marketPositions.isLoading}
                className="smooth-action inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#E5E5E5] px-4 text-sm font-semibold text-[#525252] disabled:cursor-not-allowed disabled:opacity-60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <div className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 dark:border-[#1F1F1F] dark:bg-[#141414] md:text-right">
              <div className="flex items-center gap-2 text-xs text-[#525252] dark:text-[#A1A1A1]">
                <LockKeyhole size={14} />
                Decrypted Tab PNL
              </div>
              <div
                className={`mt-1 font-mono text-xl font-semibold ${
                  totalPnl >= 0 ? "text-[#16A34A] dark:text-[#22C55E]" : "text-[#DC2626] dark:text-[#EF4444]"
                }`}
              >
                {formatPnl(totalPnl)}
              </div>
            </div>
          </div>
        </header>

        {marketPositions.error && (
          <div className="mb-4 rounded-md border border-[#DC2626]/30 px-4 py-3 text-sm font-semibold text-[#DC2626]">
            {marketPositions.error.message}
          </div>
        )}
        {marketPositions.metadataError && !marketPositions.error && (
          <div className="mb-4 rounded-md border border-[#FFD60A]/40 px-4 py-3 text-sm font-semibold text-[#A37500] dark:text-[#FFD60A]">
            Positions are loading from chain, but backend market metadata is unavailable:{" "}
            {marketPositions.metadataError.message}
          </div>
        )}

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
          <div className="hidden grid-cols-[minmax(15rem,1fr)_4rem_5.5rem_4.5rem_6.5rem_7rem_8rem] items-center gap-2 border-b border-[#E5E5E5] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#525252] dark:border-[#1F1F1F] dark:text-[#A1A1A1] md:grid">
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
                className="grid gap-3 px-4 py-4 text-sm hover:bg-[#F8FAFC] dark:hover:bg-[#0A0A0A] md:grid-cols-[minmax(15rem,1fr)_4rem_5.5rem_4.5rem_6.5rem_7rem_8rem] md:items-center md:gap-2"
              >
                <span className="min-w-0">
                  {position.hasMetadata ? (
                    <Link
                      href={position.href}
                      className="smooth-action block truncate font-semibold text-[#0A0A0A] hover:text-[#A37500] dark:text-[#FAFAFA] dark:hover:text-[#FFD60A]"
                    >
                      {position.market}
                    </Link>
                  ) : (
                    <span className="block truncate font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                      {position.market}
                    </span>
                  )}
                  <span className="mt-1 flex items-center gap-1 text-xs text-[#525252] dark:text-[#A1A1A1]">
                    <BarChart3 size={13} />
                    {position.status[0].toUpperCase() + position.status.slice(1)}
                    {!position.hasMetadata && <span>/ metadata unavailable</span>}
                  </span>
                </span>
                <span className={`md:text-center ${position.side === "Yes" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                  <span className="text-[#525252] dark:text-[#A1A1A1] md:hidden">Side: </span>
                  {position.side}
                </span>
                <span className="font-mono text-[#525252] dark:text-[#A1A1A1] md:text-right">
                  <span className="md:hidden">Stake: </span>
                  {position.stake}
                  {position.isEncrypted && (
                    <span className="ml-2 rounded-md border border-[#FFD60A]/30 px-1.5 py-0.5 text-[10px] text-[#A37500] dark:text-[#FFD60A]">
                      Locked
                    </span>
                  )}
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
                  {position.status === "open" ? (
                    <PnlAction
                      isOpen={position.status === "open"}
                      onchainMarketId={position.onchainMarketId}
                      outcome={position.outcome}
                      stakeValue={position.stakeValue}
                      onPnlResolved={pnl => setPnlByPosition(current => ({ ...current, [position.id]: pnl }))}
                    />
                  ) : (
                    <>
                      {formatPnl(pnlByPosition[position.id] ?? position.pnl)}
                      <ArrowUpRight size={14} />
                    </>
                  )}
                </span>
                {position.status === "completed" && position.isWinningPosition ? (
                  <ClaimAction
                    isCompleted={position.status === "completed"}
                    onchainMarketId={position.onchainMarketId}
                    onSettled={marketPositions.refresh}
                  />
                ) : position.status === "completed" ? (
                  <span className="text-right text-xs text-[#525252] dark:text-[#A1A1A1]">No payout</span>
                ) : position.status === "open" ? (
                  <ExitAction
                    isOpen={position.status === "open"}
                    onchainMarketId={position.onchainMarketId}
                    outcome={position.outcome}
                    pendingExit={marketPositions.pendingExit}
                    isPendingExitLoading={marketPositions.isPendingExitLoading}
                    onExited={marketPositions.refresh}
                  />
                ) : (
                  <span className="text-right text-xs text-[#525252] dark:text-[#A1A1A1]">-</span>
                )}
              </div>
            ))}
            {visiblePositions.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-[#525252] dark:text-[#A1A1A1]">
                {marketPositions.isLoading
                  ? "Reading encrypted positions from the contract..."
                  : "No positions found for this tab."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
