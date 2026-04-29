"use client";

import { Clock, Flame, Lock } from "lucide-react";
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

export const MarketCard = ({ market }: { market: Market }) => {
  const probability = useLiveProbability(market.yesProbability, market.sentimentSignals);
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const timeLeft = formatTimeRemaining(market.endsAt);
  const catClass = categoryStyles[market.category];

  return (
    <article className="flex flex-col gap-4 rounded-[0.75rem] border border-[#E5E5E5] dark:border-[#1F1F1F] bg-white dark:bg-[#141414] p-5 transition-colors hover:border-[#FFD60A]/60">
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
          className="flex-1 flex items-center justify-between rounded-[0.5rem] border border-[#16A34A]/30 dark:border-[#22C55E]/30 bg-[#16A34A]/5 dark:bg-[#22C55E]/5 px-3 py-2 text-sm text-[#16A34A] dark:text-[#22C55E] hover:bg-[#16A34A]/10 dark:hover:bg-[#22C55E]/10 transition-colors"
        >
          <span>Yes</span>
          <span className="font-mono font-semibold">{yesPct}%</span>
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-between rounded-[0.5rem] border border-[#DC2626]/30 dark:border-[#EF4444]/30 bg-[#DC2626]/5 dark:bg-[#EF4444]/5 px-3 py-2 text-sm text-[#DC2626] dark:text-[#EF4444] hover:bg-[#DC2626]/10 dark:hover:bg-[#EF4444]/10 transition-colors"
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
