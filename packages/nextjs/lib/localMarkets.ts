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
  token: "Testnet ETH",
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

export const getAllMarkets = () => [...getLocalMarkets().filter(market => market.status === "open"), ...mockMarkets];

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

export const getMarketRequestCooldown = () => {
  const latestRequestTime = getLocalMarkets()
    .filter(market => market.status !== "draft")
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
});

export const saveCreateMarketDraft = (draft: CreateMarketDraft) => {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const clearCreateMarketDraft = () => {
  window.localStorage.removeItem(DRAFT_KEY);
};

export const createMarketFromDraft = (draft: CreateMarketDraft): LocalMarket => {
  const cleanSources = draft.sources.map(source => source.trim()).filter(Boolean);
  const createdAt = new Date().toISOString();
  const idBase = slugify(draft.question) || "custom-market";

  return {
    id: `${idBase}-${Date.now()}`,
    question: draft.question.trim(),
    category: draft.category || "finance",
    yesProbability: 0.5,
    encryptedVolumeLabel: "Presale",
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
    token: draft.token,
  };
};
