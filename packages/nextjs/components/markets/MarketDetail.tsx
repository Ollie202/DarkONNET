"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { fallbackImages, marketImages } from "~~/components/markets/MarketCard";
import { SentimentBar, useLiveProbability } from "~~/components/markets/SentimentBar";
import { type Market, formatTimeRemaining } from "~~/lib/mockMarkets";

type SelectedSide = "yes" | "no" | null;
type AmountMode = "token" | "usd";

type MarketDetailProps = {
  market: Market;
};

const presetAmounts = [1, 5, 10, 20, 50];

const walletTokens = [
  { symbol: "ETH", label: "Sepolia ETH", balance: 0.42, usdPrice: 3380 },
  { symbol: "USDC", label: "Mock USDC", balance: 250, usdPrice: 1 },
  { symbol: "ZAMA", label: "Test ZAMA", balance: 1000, usdPrice: 0.12 },
];

const marketDescriptions: Partial<Record<string, string>> = {
  "oil-100-june":
    "This market resolves Yes if a widely cited Brent crude benchmark trades above $100 before July 1, 2026. It is intended to track energy supply stress, geopolitical risk, and commodity market pressure.",
  "middle-east-supply":
    "This market tracks whether reported shipping disruptions connected to Middle East routes meaningfully ease before August 2026.",
  "global-growth-31":
    "This market resolves around whether the IMF keeps 2026 global growth at or above 3.1% in its next major published outlook update.",
  "fed-cut-summer":
    "This market resolves Yes if the Federal Reserve cuts its target rate before the end of summer 2026.",
  "ai-stocks-correction":
    "This market tracks whether a basket of major AI-linked equities experiences a broad 10% correction before Q4 2026.",
};

const getMarketDescription = (market: Market) =>
  marketDescriptions[market.id] ??
  `This market resolves according to credible public reporting and the stated resolution date. The outcome should be judged from reliable sources relevant to ${market.signalLabel.toLowerCase()}.`;

const formatCategory = (category: Market["category"]) => category[0].toUpperCase() + category.slice(1);

export const MarketDetail = ({ market }: MarketDetailProps) => {
  const searchParams = useSearchParams();
  const probability = useLiveProbability(market.yesProbability, market.sentimentSignals);
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const initialSide = searchParams.get("side");
  const [selectedSide, setSelectedSide] = useState<SelectedSide>(
    initialSide === "yes" || initialSide === "no" ? initialSide : null,
  );
  const [selectedToken, setSelectedToken] = useState(walletTokens[0].symbol);
  const [amountMode, setAmountMode] = useState<AmountMode>("usd");
  const [amount, setAmount] = useState("");
  const imageUrl = marketImages[market.id] ?? fallbackImages[market.category];
  const selectedTokenInfo = walletTokens.find(token => token.symbol === selectedToken) ?? walletTokens[0];
  const parsedAmount = Number(amount);
  const tokenAmount = amountMode === "token" ? parsedAmount || 0 : (parsedAmount || 0) / selectedTokenInfo.usdPrice;
  const usdAmount = amountMode === "usd" ? parsedAmount || 0 : (parsedAmount || 0) * selectedTokenInfo.usdPrice;
  const hasInsufficientBalance = tokenAmount > selectedTokenInfo.balance;

  useEffect(() => {
    const side = searchParams.get("side");
    setSelectedSide(side === "yes" || side === "no" ? side : null);
  }, [searchParams]);

  const estimatedShares = useMemo(() => {
    if (!usdAmount || !selectedSide || hasInsufficientBalance) return "0.00";
    const price = selectedSide === "yes" ? probability : 1 - probability;
    return (usdAmount / Math.max(price, 0.01)).toFixed(2);
  }, [hasInsufficientBalance, probability, selectedSide, usdAmount]);

  const formatTokenBalance = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  const formatUsd = (value: number) =>
    value.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 1 ? 2 : 4,
    });

  return (
    <section className="px-6 py-6 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 lg:overflow-y-auto lg:pr-2">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#525252] transition-colors hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
          >
            <ArrowLeft size={16} />
            Back To Markets
          </Link>

          <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div
              className="relative h-56 bg-center bg-no-repeat md:h-72"
              style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "100% auto" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                    {formatCategory(market.category)}
                  </span>
                  {market.trending && (
                    <span className="rounded-md border border-[#FFD60A]/40 bg-[#FFD60A]/15 px-2 py-1 text-xs font-semibold text-[#FFD60A] backdrop-blur">
                      Trending
                    </span>
                  )}
                </div>
                <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-white md:text-3xl">
                  {market.question}
                </h1>
              </div>
            </div>

            <div className="space-y-6 p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Current Yes</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#16A34A] dark:text-[#22C55E]">
                    {yesPct}%
                  </div>
                </div>
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Current No</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#DC2626] dark:text-[#EF4444]">
                    {noPct}%
                  </div>
                </div>
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Closes In</div>
                  <div className="mt-1 flex items-center gap-2 text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                    <CalendarClock size={20} />
                    {formatTimeRemaining(market.endsAt)}
                  </div>
                </div>
              </div>

              <SentimentBar probability={probability} signals={market.sentimentSignals} />

              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Description</h2>
                <p className="mt-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
                  {getMarketDescription(market)}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Resolution Rules</h2>
                <div className="mt-3 space-y-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
                  <p>
                    Resolves Yes if the condition in the market title is confirmed by reliable public reporting before
                    the resolution date. Otherwise, it resolves No.
                  </p>
                  <p>
                    Ambiguous reporting, conflicting sources, or incomplete data should be settled by the clearest
                    primary or widely cited public source available at resolution.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Sources</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {["Major public news wires", "Official releases or market benchmarks"].map(source => (
                    <button
                      key={source}
                      type="button"
                      className="flex items-center justify-between rounded-md border border-[#E5E5E5] bg-[#F8FAFC] px-3 py-3 text-left text-sm text-[#525252] transition-colors hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                    >
                      {source}
                      <ExternalLink size={15} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:h-full lg:overflow-y-auto lg:pr-1">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-[0_18px_50px_-36px_rgba(10,10,10,0.55)] dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Place Bet</h2>
                <p className="mt-1 text-xs text-[#525252] dark:text-[#A1A1A1]">
                  No side is selected until you choose one.
                </p>
              </div>
              <Lock size={18} className="text-[#FFD60A]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSide("yes")}
                className={`h-11 cursor-pointer rounded-md border px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                  selectedSide === "yes"
                    ? "border-[#16A34A] bg-[#16A34A] text-white"
                    : "border-[#16A34A]/30 bg-[#16A34A]/5 text-[#16A34A] hover:bg-[#16A34A]/10 dark:text-[#22C55E]"
                }`}
              >
                Yes {yesPct}%
              </button>
              <button
                type="button"
                onClick={() => setSelectedSide("no")}
                className={`h-11 cursor-pointer rounded-md border px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                  selectedSide === "no"
                    ? "border-[#DC2626] bg-[#DC2626] text-white"
                    : "border-[#DC2626]/30 bg-[#DC2626]/5 text-[#DC2626] hover:bg-[#DC2626]/10 dark:text-[#EF4444]"
                }`}
              >
                No {noPct}%
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Token From Wallet</span>
              <select
                value={selectedToken}
                onChange={event => setSelectedToken(event.target.value)}
                className="mt-2 h-11 w-full cursor-pointer rounded-md border border-[#E5E5E5] bg-white px-3 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
              >
                {walletTokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 flex justify-between text-xs text-[#525252] dark:text-[#A1A1A1]">
                <span>
                  Balance {formatTokenBalance(selectedTokenInfo.balance)} {selectedTokenInfo.symbol}
                </span>
                <span>{formatUsd(selectedTokenInfo.balance * selectedTokenInfo.usdPrice)}</span>
              </span>
            </label>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Amount</span>
                <div className="grid grid-cols-2 rounded-md border border-[#E5E5E5] p-0.5 text-xs font-semibold dark:border-[#1F1F1F]">
                  {(["usd", "token"] as AmountMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAmount("");
                        setAmountMode(mode);
                      }}
                      className={`h-7 cursor-pointer rounded px-3 transition-colors ${
                        amountMode === mode
                          ? "bg-[#FFD60A] text-[#0A0A0A]"
                          : "text-[#525252] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                      }`}
                    >
                      {mode === "usd" ? "USD" : selectedTokenInfo.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] transition-colors hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                  >
                    {amountMode === "usd" ? `$${preset}` : `${preset} ${selectedTokenInfo.symbol}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      amountMode === "usd"
                        ? String((selectedTokenInfo.balance * selectedTokenInfo.usdPrice).toFixed(2))
                        : String(selectedTokenInfo.balance),
                    )
                  }
                  className="h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] transition-colors hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                >
                  Max
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                placeholder={amountMode === "usd" ? "Enter USD amount" : `Enter ${selectedTokenInfo.symbol} amount`}
                className={`mt-3 h-12 w-full rounded-md border bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:bg-[#0A0A0A] dark:text-[#FAFAFA] ${
                  hasInsufficientBalance ? "border-[#DC2626]" : "border-[#E5E5E5] dark:border-[#1F1F1F]"
                }`}
              />
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-[#525252] dark:text-[#A1A1A1]">
                  {amountMode === "usd"
                    ? `${formatTokenBalance(tokenAmount)} ${selectedTokenInfo.symbol}`
                    : formatUsd(usdAmount)}
                </span>
                {hasInsufficientBalance && <span className="font-semibold text-[#DC2626]">Insufficient Balance</span>}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-3 text-sm dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
              <div className="flex justify-between text-[#525252] dark:text-[#A1A1A1]">
                <span>Selected</span>
                <span className="font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  {selectedSide ? selectedSide.toUpperCase() : "None"}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-[#525252] dark:text-[#A1A1A1]">
                <span>Estimated Shares</span>
                <span className="font-mono text-[#0A0A0A] dark:text-[#FAFAFA]">{estimatedShares}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedSide || !amount || hasInsufficientBalance}
              className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFD60A]/90 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <ShieldCheck size={17} />
              Review Encrypted Bet
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};
