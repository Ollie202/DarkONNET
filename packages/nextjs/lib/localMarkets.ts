"use client";

import { type Market, type MarketCategory, mockMarkets } from "~~/lib/mockMarkets";

export type LocalMarket = Market & {
  createdAt: string;
  status: "draft" | "pending" | "open";
  rules: string;
  sources: string[];
  coverImageName?: string;
  softCap: number;
  token: string;
};

const MARKETS_KEY = "markets:created";
const DRAFT_KEY = "markets:create-draft";

export type CreateMarketDraft = {
  question: string;
  category: "" | MarketCategory;
  coverImageName: string;
  sources: string[];
  rules: string;
  presaleEndDate: string;
  resolutionDate: string;
  softCap: string;
  token: string;
};

export const emptyCreateMarketDraft: CreateMarketDraft = {
  question: "",
  category: "",
  coverImageName: "",
  sources: [""],
  rules: "",
  presaleEndDate: "",
  resolutionDate: "",
  softCap: "",
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

export const getLocalMarkets = () => readJson<LocalMarket[]>(MARKETS_KEY, []);

export const getAllMarkets = () => [...getLocalMarkets().filter(market => market.status !== "draft"), ...mockMarkets];

export const getLocalMarketById = (id: string) => getLocalMarkets().find(market => market.id === id);

export const saveLocalMarket = (market: LocalMarket) => {
  const nextMarkets = [market, ...getLocalMarkets().filter(item => item.id !== market.id)];
  window.localStorage.setItem(MARKETS_KEY, JSON.stringify(nextMarkets));
  window.dispatchEvent(new Event("local-markets-updated"));
};

export const getCreateMarketDraft = () => readJson<CreateMarketDraft>(DRAFT_KEY, emptyCreateMarketDraft);

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
    softCap: Number(draft.softCap) || 0,
    token: draft.token,
  };
};
