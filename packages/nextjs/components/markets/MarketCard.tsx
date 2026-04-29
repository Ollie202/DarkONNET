"use client";

import {
  Banknote,
  Bitcoin,
  Bot,
  ChartNoAxesCombined,
  Clock,
  Disc3,
  Flame,
  Gamepad2,
  Globe2,
  Landmark,
  Lock,
  type LucideIcon,
  Mic2,
  Rocket,
  Ship,
  Trophy,
} from "lucide-react";
import { SentimentBar, useLiveProbability } from "~~/components/markets/SentimentBar";
import { type Market, formatTimeRemaining } from "~~/lib/mockMarkets";

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

type MarketCover = {
  label: string;
  detail: string;
  accent: string;
  bg: string;
  icon: LucideIcon;
};

const marketCovers: Record<string, MarketCover> = {
  "oil-100-june": {
    label: "Brent Oil",
    detail: "$100 watch",
    accent: "#F59E0B",
    bg: "linear-gradient(135deg, #2A1202 0%, #7C2D12 48%, #F59E0B 100%)",
    icon: Flame,
  },
  "middle-east-supply": {
    label: "Shipping",
    detail: "Supply route risk",
    accent: "#38BDF8",
    bg: "linear-gradient(135deg, #082F49 0%, #0F172A 52%, #38BDF8 100%)",
    icon: Ship,
  },
  "global-growth-31": {
    label: "Global GDP",
    detail: "3.1% outlook",
    accent: "#22C55E",
    bg: "linear-gradient(135deg, #052E16 0%, #14532D 48%, #22C55E 100%)",
    icon: Globe2,
  },
  "fed-cut-summer": {
    label: "Fed Rates",
    detail: "Summer cut",
    accent: "#60A5FA",
    bg: "linear-gradient(135deg, #111827 0%, #1E3A8A 50%, #60A5FA 100%)",
    icon: Landmark,
  },
  "ai-stocks-correction": {
    label: "AI Equities",
    detail: "Correction risk",
    accent: "#A78BFA",
    bg: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #A78BFA 100%)",
    icon: Bot,
  },
  "btc-150k-2026": {
    label: "Bitcoin",
    detail: "$150k close",
    accent: "#FFD60A",
    bg: "linear-gradient(135deg, #18181B 0%, #713F12 48%, #FFD60A 100%)",
    icon: Bitcoin,
  },
  "us-midterms-house": {
    label: "U.S. House",
    detail: "Midterm control",
    accent: "#F87171",
    bg: "linear-gradient(135deg, #1E293B 0%, #7F1D1D 50%, #F87171 100%)",
    icon: Landmark,
  },
  "ru-ua-ceasefire-2026": {
    label: "Ceasefire",
    detail: "Diplomacy watch",
    accent: "#F97316",
    bg: "linear-gradient(135deg, #111827 0%, #431407 52%, #F97316 100%)",
    icon: Globe2,
  },
  "argentina-wc-2026": {
    label: "World Cup",
    detail: "Argentina odds",
    accent: "#38BDF8",
    bg: "linear-gradient(135deg, #082F49 0%, #065F46 50%, #38BDF8 100%)",
    icon: Trophy,
  },
  "frontier-ai-release": {
    label: "Frontier AI",
    detail: "Flagship model",
    accent: "#C084FC",
    bg: "linear-gradient(135deg, #020617 0%, #581C87 50%, #C084FC 100%)",
    icon: Bot,
  },
  "swift-tour-2026": {
    label: "Tour Cycle",
    detail: "Music demand",
    accent: "#F472B6",
    bg: "linear-gradient(135deg, #500724 0%, #831843 52%, #F472B6 100%)",
    icon: Mic2,
  },
  "eth-flippening": {
    label: "ETH/BTC",
    detail: "Flippening",
    accent: "#8B5CF6",
    bg: "linear-gradient(135deg, #111827 0%, #4C1D95 50%, #8B5CF6 100%)",
    icon: ChartNoAxesCombined,
  },
  "starship-orbit-return": {
    label: "Starship",
    detail: "Orbit return",
    accent: "#FB923C",
    bg: "linear-gradient(135deg, #0F172A 0%, #7C2D12 52%, #FB923C 100%)",
    icon: Rocket,
  },
  "red-sea-normalizes": {
    label: "Red Sea",
    detail: "Freight normalizes",
    accent: "#2DD4BF",
    bg: "linear-gradient(135deg, #042F2E 0%, #164E63 52%, #2DD4BF 100%)",
    icon: Ship,
  },
  "sol-etf-2026": {
    label: "Solana ETF",
    detail: "Approval watch",
    accent: "#14F195",
    bg: "linear-gradient(135deg, #111827 0%, #134E4A 52%, #14F195 100%)",
    icon: ChartNoAxesCombined,
  },
  "nba-finals-east": {
    label: "NBA Finals",
    detail: "East vs West",
    accent: "#FB923C",
    bg: "linear-gradient(135deg, #1C1917 0%, #7C2D12 50%, #FB923C 100%)",
    icon: Trophy,
  },
  "apple-ai-device": {
    label: "AI Hardware",
    detail: "Product launch",
    accent: "#94A3B8",
    bg: "linear-gradient(135deg, #020617 0%, #334155 52%, #94A3B8 100%)",
    icon: Bot,
  },
  "uk-election-2026": {
    label: "UK Election",
    detail: "Westminster",
    accent: "#60A5FA",
    bg: "linear-gradient(135deg, #111827 0%, #1D4ED8 50%, #60A5FA 100%)",
    icon: Landmark,
  },
  "drake-album-2026": {
    label: "Album Watch",
    detail: "Streaming cycle",
    accent: "#A78BFA",
    bg: "linear-gradient(135deg, #2E1065 0%, #5B21B6 52%, #A78BFA 100%)",
    icon: Disc3,
  },
  "lol-worlds-korea": {
    label: "LoL Worlds",
    detail: "Korea strength",
    accent: "#A78BFA",
    bg: "linear-gradient(135deg, #111827 0%, #4C1D95 52%, #A78BFA 100%)",
    icon: Gamepad2,
  },
  "us-recession-2026": {
    label: "U.S. Economy",
    detail: "Recession risk",
    accent: "#FBBF24",
    bg: "linear-gradient(135deg, #1F2937 0%, #713F12 52%, #FBBF24 100%)",
    icon: Banknote,
  },
  "tesla-robotaxi-5": {
    label: "Robotaxi",
    detail: "City rollout",
    accent: "#22D3EE",
    bg: "linear-gradient(135deg, #083344 0%, #0E7490 52%, #22D3EE 100%)",
    icon: Bot,
  },
  "taiwan-strait-incident": {
    label: "Taiwan Strait",
    detail: "Security watch",
    accent: "#F87171",
    bg: "linear-gradient(135deg, #111827 0%, #7F1D1D 52%, #F87171 100%)",
    icon: Globe2,
  },
  "csgo-major-eu": {
    label: "CS Major",
    detail: "EU teams",
    accent: "#FACC15",
    bg: "linear-gradient(135deg, #18181B 0%, #3F3F46 52%, #FACC15 100%)",
    icon: Gamepad2,
  },
};

const fallbackCovers: Record<Market["category"], MarketCover> = {
  crypto: marketCovers["btc-150k-2026"],
  politics: marketCovers["us-midterms-house"],
  sports: marketCovers["argentina-wc-2026"],
  tech: marketCovers["frontier-ai-release"],
  culture: marketCovers["swift-tour-2026"],
  finance: marketCovers["global-growth-31"],
  geopolitics: marketCovers["ru-ua-ceasefire-2026"],
  esports: marketCovers["lol-worlds-korea"],
};

export const MarketCard = ({ market }: { market: Market }) => {
  const probability = useLiveProbability(market.yesProbability, market.sentimentSignals);
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const timeLeft = formatTimeRemaining(market.endsAt);
  const catClass = categoryStyles[market.category];
  const cover = marketCovers[market.id] ?? fallbackCovers[market.category];
  const CoverIcon = cover.icon;

  return (
    <article className="group flex cursor-pointer flex-col gap-4 rounded-[0.75rem] border border-[#E5E5E5] bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.045] hover:border-[#FFD60A]/70 hover:shadow-[0_12px_24px_-14px_rgba(10,10,10,0.55)] active:translate-y-0 active:scale-[1.01] dark:border-[#1F1F1F] dark:bg-[#141414] dark:hover:shadow-[0_12px_24px_-14px_rgba(255,214,10,0.45)]">
      <div
        className="-mx-1 -mt-1 overflow-hidden rounded-lg border border-[#E5E5E5] dark:border-[#1F1F1F]"
        style={{ background: cover.bg }}
      >
        <div className="relative h-28 overflow-hidden p-4 text-white transition-transform duration-200 ease-out group-hover:scale-[1.045]">
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-25 blur-xl"
            style={{ backgroundColor: cover.accent }}
          />
          <div aria-hidden="true" className="absolute bottom-3 right-4 h-14 w-24 rounded-full border border-white/15" />
          <div className="relative flex h-full items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{cover.detail}</div>
              <div className="mt-2 max-w-[11rem] text-xl font-semibold leading-none">{cover.label}</div>
            </div>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_16px_30px_-18px_rgba(255,255,255,0.85)]"
              style={{ color: cover.accent }}
            >
              <CoverIcon size={28} />
            </div>
          </div>
        </div>
      </div>

      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded-md border ${catClass}`}>
            {market.category[0].toUpperCase() + market.category.slice(1)}
          </span>
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

      <div>
        <h3 className="text-[15px] leading-snug text-[#0A0A0A] dark:text-[#FAFAFA]">{market.question}</h3>
        <p className="mt-2 text-xs text-[#525252] dark:text-[#A1A1A1]">{market.signalLabel}</p>
      </div>

      <SentimentBar probability={probability} signals={market.sentimentSignals} />

      <div className="flex gap-2">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center justify-between rounded-[0.5rem] border border-[#16A34A]/30 bg-[#16A34A]/5 px-3 py-2 text-sm text-[#16A34A] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.045] hover:border-[#16A34A]/60 hover:bg-[#16A34A]/15 hover:shadow-[0_12px_24px_-14px_rgba(22,163,74,0.75)] active:translate-y-0 active:scale-[1.01] dark:border-[#22C55E]/30 dark:bg-[#22C55E]/5 dark:text-[#22C55E] dark:hover:bg-[#22C55E]/10"
        >
          <span>Yes</span>
          <span className="font-mono font-semibold">{yesPct}%</span>
        </button>
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center justify-between rounded-[0.5rem] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626] transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.045] hover:border-[#DC2626]/60 hover:bg-[#DC2626]/15 hover:shadow-[0_12px_24px_-14px_rgba(220,38,38,0.75)] active:translate-y-0 active:scale-[1.01] dark:border-[#EF4444]/30 dark:bg-[#EF4444]/5 dark:text-[#EF4444] dark:hover:bg-[#EF4444]/10"
        >
          <span>No</span>
          <span className="font-mono font-semibold">{noPct}%</span>
        </button>
      </div>

      <footer className="flex items-center justify-between pt-3 border-t border-[#E5E5E5] dark:border-[#1F1F1F] text-[11px] text-[#525252] dark:text-[#A1A1A1]">
        <span className="inline-flex items-center gap-1">
          <Lock size={11} /> Volume {market.encryptedVolumeLabel}
        </span>
        <span className="font-mono">ID {market.id.slice(0, 6)}</span>
      </footer>
    </article>
  );
};
