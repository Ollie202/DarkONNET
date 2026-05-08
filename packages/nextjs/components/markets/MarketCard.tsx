"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock, Flame, Lock } from "lucide-react";
import { useReadContract } from "wagmi";
import { MatchupVisual } from "~~/components/markets/MatchupVisual";
import { SentimentBar, useLiveProbability } from "~~/components/markets/SentimentBar";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { type OnchainPoolSnapshot } from "~~/hooks/markets/useOnchainMarketVolumes";
import { useTimeRemaining } from "~~/hooks/markets/useTimeRemaining";
import { type Market, formatMarketVolume, isMarketEnded } from "~~/lib/mockMarkets";
import { formatPlatformTokenUnits } from "~~/lib/token";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

const categoryStyles: Record<Market["category"], string> = {
  crypto: "text-[#A37500] dark:text-[#FFD60A] border-[#FFD60A]/40",
  politics: "text-[#0A0A0A] dark:text-[#FAFAFA] border-[#E5E5E5] dark:border-[#1F1F1F]",
  sports: "text-[#16A34A] dark:text-[#22C55E] border-[#16A34A]/30 dark:border-[#22C55E]/30",
  tech: "text-[#0A0A0A] dark:text-[#FAFAFA] border-[#E5E5E5] dark:border-[#1F1F1F]",
  culture: "text-[#525252] dark:text-[#A1A1A1] border-[#E5E5E5] dark:border-[#1F1F1F]",
  finance: "text-[#D97706] dark:text-[#F59E0B] border-[#D97706]/30 dark:border-[#F59E0B]/30",
  geopolitics: "text-[#DC2626] dark:text-[#EF4444] border-[#DC2626]/30 dark:border-[#EF4444]/30",
  esports: "text-[#7C3AED] dark:text-[#A78BFA] border-[#7C3AED]/30 dark:border-[#A78BFA]/30",
};

export const marketImages: Record<string, string> = {
  "oil-100-june": "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80",
  "middle-east-supply": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=900&q=80",
  "global-growth-31": "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  "fed-cut-summer": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  "ai-stocks-correction":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  "btc-150k-2026": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80",
  "us-midterms-house": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80",
  "ru-ua-ceasefire-2026":
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=80",
  "argentina-wc-2026": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=900&q=80",
  "frontier-ai-release": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80",
  "swift-tour-2026": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
  "eth-flippening": "https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=900&q=80",
  "starship-orbit-return":
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
  "red-sea-normalizes": "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=900&q=80",
  "sol-etf-2026": "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=900&q=80",
  "nba-finals-east": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
  "apple-ai-device": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "uk-election-2026": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=900&q=80",
  "drake-album-2026": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
  "lol-worlds-korea": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
  "us-recession-2026": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80",
  "tesla-robotaxi-5": "https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=900&q=80",
  "taiwan-strait-incident":
    "https://images.unsplash.com/photo-1569959220744-ff553533f492?auto=format&fit=crop&w=900&q=80",
  "csgo-major-eu": "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=900&q=80",
};

export const fallbackImages: Record<Market["category"], string> = {
  crypto: marketImages["btc-150k-2026"],
  politics: marketImages["us-midterms-house"],
  sports: marketImages["argentina-wc-2026"],
  tech: marketImages["frontier-ai-release"],
  culture: marketImages["swift-tour-2026"],
  finance: marketImages["global-growth-31"],
  geopolitics: marketImages["ru-ua-ceasefire-2026"],
  esports: marketImages["lol-worlds-korea"],
};

const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);
type MarketInfo = readonly [bigint, string, string, bigint, boolean, number, boolean, boolean];

const getResolutionLabel = (marketInfo?: MarketInfo, fallbackResolution?: Market["resolution"]) => {
  if (marketInfo?.[6] || fallbackResolution === "canceled") return "Canceled";
  if (marketInfo?.[4]) return marketInfo[5] === 0 ? "Resolved Yes" : "Resolved No";
  if (fallbackResolution === "yes") return "Resolved Yes";
  if (fallbackResolution === "no") return "Resolved No";
  return "";
};

export const MarketCard = ({
  market,
  onchainPoolSnapshot,
  onchainProbability,
  onchainVolume,
}: {
  market: Market;
  onchainPoolSnapshot?: OnchainPoolSnapshot;
  onchainProbability?: number;
  onchainVolume?: bigint;
}) => {
  const metadataProbability = useLiveProbability(market.yesProbability, market.sentimentSignals);
  const onchainMarketId = useMemo(() => {
    if (!market.onchainMarketId) return undefined;
    try {
      return BigInt(market.onchainMarketId);
    } catch {
      return undefined;
    }
  }, [market.onchainMarketId]);
  const probability = onchainProbability ?? metadataProbability;
  const volumeLabel =
    onchainVolume !== undefined
      ? formatPlatformTokenUnits(onchainVolume)
      : onchainPoolSnapshot
        ? formatPlatformTokenUnits(onchainPoolSnapshot.yes + onchainPoolSnapshot.no)
        : formatMarketVolume(market);
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const timeLeft = useTimeRemaining(market.endsAt);
  const isEnded = isMarketEnded(market.endsAt);
  const catClass = categoryStyles[market.category];
  const routeId = market.slug || market.id;
  const imageUrl =
    market.coverImageDataUrl ?? marketImages[routeId] ?? marketImages[market.id] ?? fallbackImages[market.category];
  const marketPath = `/markets/${routeId}`;
  const marketInfoRead = useReadContract({
    address: marketContract?.address,
    abi: marketContract?.abi,
    functionName: "getMarketInfo",
    args: onchainMarketId === undefined ? undefined : [onchainMarketId],
    chainId: sepolia.id,
    query: {
      enabled: false,
      refetchOnWindowFocus: false,
    },
  });
  const marketInfo = marketInfoRead.data as MarketInfo | undefined;
  const resolutionLabel = getResolutionLabel(marketInfo, market.resolution);
  const isTradable =
    market.status !== "pending" &&
    market.status !== "declined" &&
    market.status !== "resolved" &&
    !resolutionLabel &&
    !isEnded;
  const isCreatorMarket = Boolean(market.creatorKey);
  const statusLabel =
    resolutionLabel ||
    (market.status === "pending"
      ? "Pending"
      : market.status === "declined"
        ? "Declined"
        : market.status === "resolved"
          ? "Resolved"
          : isEnded
            ? "Ended"
            : market.status === "open" && isCreatorMarket
              ? "Creator"
              : "");

  return (
    <article className="group relative flex cursor-pointer flex-col gap-4 rounded-[0.75rem] border border-[#E5E5E5] bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.045] hover:border-[#FFD60A]/70 hover:shadow-[0_12px_24px_-14px_rgba(10,10,10,0.55)] dark:border-[#1F1F1F] dark:bg-[#141414] dark:hover:shadow-[0_12px_24px_-14px_rgba(255,214,10,0.45)]">
      <Link
        href={marketPath}
        aria-label={`Open market: ${market.question}`}
        className="absolute inset-0 z-10 rounded-[0.75rem]"
      />

      <div className="pointer-events-none relative z-20 -mx-1 -mt-1 overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#F4F4F5] dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
        <MatchupVisual fallbackImageUrl={imageUrl} market={market} />
      </div>

      <header className="pointer-events-none relative z-20 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded-md border ${catClass}`}>
            {market.category[0].toUpperCase() + market.category.slice(1)}
          </span>
          {statusLabel === "Pending" && (
            <span className="rounded-md border border-[#FFD60A]/40 px-2 py-0.5 text-[10px] tracking-wider text-[#A37500] dark:text-[#FFD60A]">
              Pending
            </span>
          )}
          {statusLabel === "Creator" && (
            <span className="rounded-md border border-[#16A34A]/30 px-2 py-0.5 text-[10px] tracking-wider text-[#16A34A] dark:text-[#22C55E]">
              Creator
            </span>
          )}
          {statusLabel === "Declined" && (
            <span className="rounded-md border border-[#DC2626]/30 px-2 py-0.5 text-[10px] tracking-wider text-[#DC2626] dark:text-[#EF4444]">
              Declined
            </span>
          )}
          {statusLabel === "Resolved" && (
            <span className="rounded-md border border-[#525252]/30 px-2 py-0.5 text-[10px] tracking-wider text-[#525252] dark:text-[#A1A1A1]">
              Resolved
            </span>
          )}
          {statusLabel === "Ended" && (
            <span className="rounded-md border border-[#525252]/30 px-2 py-0.5 text-[10px] tracking-wider text-[#525252] dark:text-[#A1A1A1]">
              Ended
            </span>
          )}
          {resolutionLabel && (
            <span className="rounded-md border border-[#525252]/30 px-2 py-0.5 text-[10px] tracking-wider text-[#525252] dark:text-[#A1A1A1]">
              {resolutionLabel}
            </span>
          )}
          {market.trending && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#D97706] dark:text-[#F59E0B]">
              <Flame size={11} /> Trending
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#525252] dark:text-[#A1A1A1]">
          <Clock size={12} /> {timeLeft}
        </span>
      </header>

      <div className="pointer-events-none relative z-20">
        <h3 className="text-[15px] leading-snug text-[#0A0A0A] dark:text-[#FAFAFA]">{market.question}</h3>
      </div>

      <div className="pointer-events-none relative z-20">
        <SentimentBar probability={probability} signals={market.sentimentSignals} />
      </div>

      {isTradable ? (
        <div className="relative z-30 flex gap-2">
          <Link
            href={`${marketPath}?side=yes`}
            className="smooth-action flex flex-1 cursor-pointer items-center justify-between rounded-[0.5rem] border border-[#16A34A]/30 bg-[#16A34A]/5 px-3 py-2 text-sm text-[#16A34A] hover:border-[#16A34A]/60 hover:bg-[#16A34A]/15 hover:shadow-[0_12px_24px_-14px_rgba(22,163,74,0.75)] dark:border-[#22C55E]/30 dark:bg-[#22C55E]/5 dark:text-[#22C55E] dark:hover:bg-[#22C55E]/10"
          >
            <span>Yes</span>
            <span className="font-mono font-semibold">{yesPct}%</span>
          </Link>
          <Link
            href={`${marketPath}?side=no`}
            className="smooth-action flex flex-1 cursor-pointer items-center justify-between rounded-[0.5rem] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626] hover:border-[#DC2626]/60 hover:bg-[#DC2626]/15 hover:shadow-[0_12px_24px_-14px_rgba(220,38,38,0.75)] dark:border-[#EF4444]/30 dark:bg-[#EF4444]/5 dark:text-[#EF4444] dark:hover:bg-[#EF4444]/10"
          >
            <span>No</span>
            <span className="font-mono font-semibold">{noPct}%</span>
          </Link>
        </div>
      ) : (
        <Link
          href={marketPath}
          className="smooth-action relative z-30 flex h-10 items-center justify-center rounded-[0.5rem] border border-[#E5E5E5] text-sm font-semibold text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
        >
          View Market
        </Link>
      )}

      <footer className="pointer-events-none relative z-20 flex items-center justify-between border-t border-[#E5E5E5] pt-3 text-[11px] text-[#525252] dark:border-[#1F1F1F] dark:text-[#A1A1A1]">
        <span className="inline-flex items-center gap-1">
          <Lock size={11} /> Volume {volumeLabel}
        </span>
        <span className="font-mono">
          {resolutionLabel || market.status === "resolved" || isEnded
            ? "Closed"
            : market.status === "open" && isCreatorMarket
              ? "Fee 1%"
              : `ID ${market.id.slice(0, 6)}`}
        </span>
      </footer>
    </article>
  );
};
