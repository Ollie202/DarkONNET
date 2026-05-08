"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

type SentimentSignals = {
  news: number;
  volume: number;
  crowd: number;
};

export const blendSentiment = (probability: number, signals: SentimentSignals) => {
  const signalAverage = (signals.news + signals.volume + signals.crowd) / 300;
  return clamp(probability * 0.58 + signalAverage * 0.42, 0.02, 0.98);
};

export const useLiveProbability = (initial: number, signals: SentimentSignals) => {
  const [p, setP] = useState(initial);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const baseline = blendSentiment(initial, signals);
    setP(baseline);
    const tick = () => {
      setP(prev => {
        const pullToBaseline = (baseline - prev) * 0.08;
        const liveDrift = (Math.random() - 0.5) * 0.018;
        return clamp(prev + pullToBaseline + liveDrift, 0.02, 0.98);
      });
    };
    intervalRef.current = window.setInterval(tick, 2500 + Math.random() * 2000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [initial, signals]);

  return p;
};

type SentimentBarProps = {
  probability: number;
  signals: SentimentSignals;
};

export const SentimentBar = ({ probability }: SentimentBarProps) => {
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const leans = probability >= 0.5 ? "Yes" : "No";
  const lean = Math.abs(probability - 0.5) * 2;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] text-[#525252] dark:text-[#A1A1A1]">
        <span>Market Sentiment</span>
        <span>
          Leans {leans} <span className="font-mono">{(lean * 100).toFixed(0)}%</span>
        </span>
      </div>
      <div className="relative flex h-2 overflow-hidden rounded-full bg-[#E5E5E5] dark:bg-[#1F1F1F]">
        <div
          className="h-full bg-[#16A34A] transition-[width] duration-700 ease-out dark:bg-[#22C55E]"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="h-full bg-[#DC2626] transition-[width] duration-700 ease-out dark:bg-[#EF4444]"
          style={{ width: `${noPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-[#525252] dark:text-[#A1A1A1]">
        <span>Yes {yesPct}%</span>
        <span>No {noPct}%</span>
      </div>
    </div>
  );
};
