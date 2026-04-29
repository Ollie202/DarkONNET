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

const signalLabels: Array<[keyof SentimentSignals, string]> = [
  ["news", "News"],
  ["volume", "Volume"],
  ["crowd", "Crowd"],
];

export const SentimentBar = ({ probability, signals }: SentimentBarProps) => {
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
      <div className="relative h-2 rounded-full overflow-hidden bg-[#E5E5E5] dark:bg-[#1F1F1F]">
        <div
          className="absolute inset-y-0 left-0 bg-[#16A34A] dark:bg-[#22C55E] transition-[width] duration-700 ease-out"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#0A0A0A] dark:bg-[#FAFAFA] transition-[left] duration-700 ease-out"
          style={{ left: `${yesPct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px] text-[#525252] dark:text-[#A1A1A1]">
        {signalLabels.map(([key, label]) => (
          <span
            key={key}
            className="flex items-center justify-between rounded-md bg-[#F4F4F5] dark:bg-[#1F1F1F] px-2 py-1"
          >
            {label}
            <span className="font-mono text-[#0A0A0A] dark:text-[#FAFAFA]">{signals[key]}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-[#525252] dark:text-[#A1A1A1]">
        <span>Yes {yesPct}%</span>
        <span>No {noPct}%</span>
      </div>
    </div>
  );
};
