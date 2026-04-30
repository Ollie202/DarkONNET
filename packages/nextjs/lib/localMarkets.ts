"use client";

import { type Market, type MarketCategory, mockMarkets } from "~~/lib/mockMarkets";

export type LocalMarket = Market & {
  createdAt: string;
  updatedAt?: string;
  status: "draft" | "pending" | "open" | "declined";
  rules: string;
  sources: string[];
  coverImageName?: string;
  coverImageDataUrl?: string;
  creatorStake: number;
  creatorKey?: string;
  token: string;
  adminNote?: string;
};

const MARKETS_KEY = "markets:created";
const DRAFT_KEY = "markets:create-draft";
const MARKET_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type CreateMarketDraft = {
  question: string;
  category: "" | MarketCategory;
  coverImageName: string;
  coverImageDataUrl: string;
  sources: string[];
  rules: string;
  presaleEndDate: string;
  resolutionDate: string;
  creatorStake: string;
  token: string;
};

export type CreateMarketCreator = {
  creatorKey?: string;
};

export const emptyCreateMarketDraft: CreateMarketDraft = {
  question: "",
  category: "",
  coverImageName: "",
  coverImageDataUrl: "",
  sources: [""],
  rules: "",
  presaleEndDate: "",
  resolutionDate: "",
  creatorStake: "1",
  token: "cUSD",
};

const readJson = <Value>(key: string, fallback: Value): Value => {
  if (typeof window === "undefined") return fallback;

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as Value) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);

export const getLocalMarkets = () =>
  readJson<LocalMarket[]>(MARKETS_KEY, []).map(market => ({
    ...market,
    creatorStake: market.creatorStake ?? 1,
    status: market.status ?? "open",
    sources: market.sources ?? [],
  }));

export const getAllMarkets = () => mockMarkets;

export const getCreatorMarkets = () => getLocalMarkets().filter(market => market.status === "open");

export const getMyCreatorMarkets = (creatorKey?: string) => {
  if (!creatorKey) return [];
  return getLocalMarkets().filter(market => market.creatorKey === creatorKey);
};

export const getLocalMarketById = (id: string) => getLocalMarkets().find(market => market.id === id);

export const saveLocalMarket = (market: LocalMarket) => {
  const nextMarkets = [market, ...getLocalMarkets().filter(item => item.id !== market.id)];
  window.localStorage.setItem(MARKETS_KEY, JSON.stringify(nextMarkets));
  window.dispatchEvent(new Event("local-markets-updated"));
};

export const updateLocalMarketStatus = (marketId: string, status: LocalMarket["status"], adminNote = "") => {
  const nextMarkets = getLocalMarkets().map(market =>
    market.id === marketId ? { ...market, status, adminNote, updatedAt: new Date().toISOString() } : market,
  );
  window.localStorage.setItem(MARKETS_KEY, JSON.stringify(nextMarkets));
  window.dispatchEvent(new Event("local-markets-updated"));
};

export const recordLocalMarketTrade = (marketId: string, side: "yes" | "no", cUSDAmount: number) => {
  const nextMarkets = getLocalMarkets().map(market => {
    if (market.id !== marketId) return market;

    const tradeWeight = Math.min(0.08, Math.max(0.01, cUSDAmount / 1000));
    const direction = side === "yes" ? 1 : -1;
    const nextProbability = Math.min(0.96, Math.max(0.04, market.yesProbability + direction * tradeWeight));
    const currentVolume = Number(market.encryptedVolumeLabel.replace(/[^0-9.]/g, "")) || 0;

    return {
      ...market,
      yesProbability: nextProbability,
      encryptedVolumeLabel: `${Math.round(currentVolume + cUSDAmount).toLocaleString()} cUSD`,
      signalLabel: side === "yes" ? "Latest trade leaned Yes" : "Latest trade leaned No",
      sentimentSignals: {
        news: market.sentimentSignals.news,
        volume: Math.round(nextProbability * 100),
        crowd: Math.round(nextProbability * 100),
      },
      updatedAt: new Date().toISOString(),
    };
  });

  window.localStorage.setItem(MARKETS_KEY, JSON.stringify(nextMarkets));
  window.dispatchEvent(new Event("local-markets-updated"));
};

export const getMarketRequestCooldown = (creatorKey?: string) => {
  const latestRequestTime = getLocalMarkets()
    .filter(market => market.status !== "draft" && (!creatorKey || market.creatorKey === creatorKey))
    .map(market => new Date(market.createdAt).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  if (!latestRequestTime) return { canSubmit: true, remainingMs: 0 };

  const remainingMs = Math.max(0, latestRequestTime + MARKET_REQUEST_COOLDOWN_MS - Date.now());
  return { canSubmit: remainingMs === 0, remainingMs };
};

export const getCreateMarketDraft = () => ({
  ...emptyCreateMarketDraft,
  ...readJson<Partial<CreateMarketDraft>>(DRAFT_KEY, emptyCreateMarketDraft),
  token: "cUSD",
});

export const saveCreateMarketDraft = (draft: CreateMarketDraft) => {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const clearCreateMarketDraft = () => {
  window.localStorage.removeItem(DRAFT_KEY);
};

export const createMarketFromDraft = (draft: CreateMarketDraft, creator: CreateMarketCreator = {}): LocalMarket => {
  const cleanSources = draft.sources.map(source => source.trim()).filter(Boolean);
  const createdAt = new Date().toISOString();
  const idBase = slugify(draft.question) || "custom-market";

  return {
    id: `${idBase}-${Date.now()}`,
    question: draft.question.trim(),
    category: draft.category || "finance",
    yesProbability: 0.5,
    encryptedVolumeLabel: "0 cUSD",
    endsAt: draft.resolutionDate ? new Date(draft.resolutionDate).toISOString() : createdAt,
    signalLabel: "Awaiting market activity",
    sentimentSignals: { news: 50, volume: 50, crowd: 50 },
    createdAt,
    status: "pending",
    rules: draft.rules.trim(),
    sources: cleanSources,
    coverImageName: draft.coverImageName,
    coverImageDataUrl: draft.coverImageDataUrl,
    creatorStake: Math.max(1, Number(draft.creatorStake) || 1),
    creatorKey: creator.creatorKey,
    token: "cUSD",
  };
};
