"use client";

import { type LocalMarket } from "~~/lib/localMarkets";
import { type Market, type MarketCategory, parseMarketVolume } from "~~/lib/mockMarkets";

const API_BASE_URL = (process.env.NEXT_PUBLIC_DARKONNET_API_URL || "http://localhost:8787").replace(/\/$/, "");
const SESSION_STORAGE_PREFIX = "darkonnet:api-session:";

type EthereumProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ApiSession = {
  token: string;
  walletAddress: string;
  expiresAt: string;
};

export type ApiMarket = {
  marketId: string;
  onchainMarketId?: string | null;
  slug?: string | null;
  category: string;
  title: string;
  description?: string | null;
  provider?: string | null;
  imageUrl?: string | null;
  homeName?: string | null;
  awayName?: string | null;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  leagueName?: string | null;
  leagueLogoUrl?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  startsAt?: string | null;
  creatorWalletAddress?: string | null;
  status?: string | null;
  acceptedAt?: string | null;
  resolvedAt?: string | null;
  resolution?: string | null;
  participants?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiComment = {
  id: string;
  marketId: string;
  parentId: string | null;
  walletAddress: string;
  displayName: string;
  body: string;
  likedBy?: string[];
  createdAt: string;
  updatedAt: string;
  replies?: ApiComment[];
};

export type ApiNotification = {
  id: string;
  walletAddress: string;
  type: string;
  title: string;
  body: string;
  marketId?: string | null;
  commentId?: string | null;
  metadata?: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
};

export type ApiProfile = {
  walletAddress: string;
  profileName: string;
  bio: string;
  email: string;
  profileImageDataUrl: string;
  receiveUpdates: boolean;
  receivePositionNotifications: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const categoryAliases: Record<string, MarketCategory> = {
  crypto: "crypto",
  cryptocurrency: "crypto",
  politics: "politics",
  political: "politics",
  sports: "sports",
  football: "sports",
  soccer: "sports",
  nfl: "sports",
  f1: "sports",
  tech: "tech",
  technology: "tech",
  culture: "culture",
  entertainment: "culture",
  finance: "finance",
  financial: "finance",
  geopolitics: "geopolitics",
  geopolitical: "geopolitics",
  esports: "esports",
  esport: "esports",
};

const normalizeCategory = (category: string): MarketCategory => {
  const key =
    category
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)[0] || "finance";
  return categoryAliases[key] || "finance";
};

const normalizeSportType = (market: ApiMarket): Market["sportType"] => {
  const text = [market.category, market.leagueName, market.provider, market.title]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (/\bnfl\b|american football/.test(text)) return "nfl";
  if (/basketball|\bnba\b/.test(text)) return "basketball";
  if (/\bf1\b|formula/.test(text)) return "formula1";
  if (/football|soccer/.test(text)) return "football";
  return undefined;
};

const numberFromMetadata = (metadata: Record<string, unknown> | undefined, keys: string[], fallback: number) => {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
};

const stringArrayFromMetadata = (metadata: Record<string, unknown> | undefined, key: string) => {
  const value = metadata?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
};

const isHttpUrl = (value?: string) => Boolean(value && /^https?:\/\//i.test(value));

const f1CoverImages: Array<{ pattern: RegExp; imageUrl: string }> = [
  {
    pattern: /monaco|monte.?carlo/,
    imageUrl: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /canada|montreal|gilles.?villeneuve/,
    imageUrl: "https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /british|silverstone|united kingdom|great britain/,
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /italy|italian|monza|emilia|imola/,
    imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /japan|suzuka/,
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /singapore|marina bay/,
    imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /australia|melbourne|albert park/,
    imageUrl: "https://images.unsplash.com/photo-1545044846-351ba102b6d5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /bahrain|sakhir/,
    imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /saudi|jeddah/,
    imageUrl: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /miami|united states|austin|las vegas|cota|americas/,
    imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /spain|spanish|barcelona|catalunya/,
    imageUrl: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /belgium|spa/,
    imageUrl: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /netherlands|dutch|zandvoort/,
    imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /hungary|hungarian|hungaroring|budapest/,
    imageUrl: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /qatar|lusail/,
    imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
  },
  {
    pattern: /abu dhabi|yas marina|united arab emirates/,
    imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
  },
];

const genericF1CoverImage =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80";

const getF1CoverImage = (market: ApiMarket, metadata: Record<string, unknown>) => {
  if (normalizeSportType(market) !== "formula1") return undefined;

  const searchableText = [
    market.title,
    market.description,
    market.leagueName,
    market.provider,
    metadata.circuit,
    metadata.country,
    metadata.location,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return f1CoverImages.find(entry => entry.pattern.test(searchableText))?.imageUrl || genericF1CoverImage;
};

const mapApiMarket = (market: ApiMarket): Market => {
  const metadata = market.metadata || {};
  const category = normalizeCategory(market.category);
  const sportType = category === "sports" ? normalizeSportType(market) : undefined;
  const f1CoverImage = getF1CoverImage(market, metadata);
  const probability = numberFromMetadata(metadata, ["yesProbability", "probability", "odds"], 0.5);
  const boundedProbability =
    probability > 1 ? Math.min(1, probability / 100) : Math.min(0.99, Math.max(0.01, probability));
  const volume = metadata.encryptedVolumeLabel || metadata.volumeLabel || metadata.volume;
  const tradingVolume = numberFromMetadata(
    metadata,
    ["tradingVolume", "totalVolume", "volume", "volumeCUsdt", "cUSDTVolume", "tradeVolume"],
    typeof volume === "string" ? parseMarketVolume(volume) : 0,
  );
  const endsAt =
    (typeof metadata.endsAt === "string" && metadata.endsAt) ||
    (typeof metadata.resolutionDate === "string" && metadata.resolutionDate) ||
    market.startsAt ||
    market.resolvedAt ||
    market.updatedAt ||
    new Date().toISOString();
  const status = market.status === "accepted" ? "open" : market.status;

  return {
    id: market.onchainMarketId || market.marketId,
    slug:
      market.slug ||
      (market.onchainMarketId && market.marketId !== market.onchainMarketId ? market.marketId : undefined),
    onchainMarketId: market.onchainMarketId || undefined,
    question: market.title,
    description:
      market.description ||
      (typeof metadata.description === "string" && metadata.description ? metadata.description : undefined),
    category,
    sportType,
    yesProbability: boundedProbability,
    encryptedVolumeLabel:
      typeof volume === "string" ? volume : typeof volume === "number" ? `${volume} cUSDT` : "Encrypted",
    tradingVolume,
    endsAt,
    signalLabel:
      (typeof metadata.signalLabel === "string" && metadata.signalLabel) ||
      market.provider ||
      market.sourceName ||
      "Backend market metadata",
    sentimentSignals: {
      news: numberFromMetadata(metadata, ["newsSignal", "news"], Math.round(boundedProbability * 100)),
      volume: numberFromMetadata(metadata, ["volumeSignal"], Math.round(boundedProbability * 100)),
      crowd: numberFromMetadata(metadata, ["crowdSignal"], Math.round(boundedProbability * 100)),
    },
    trending: tradingVolume > 0,
    rules: typeof metadata.rules === "string" ? metadata.rules : undefined,
    sources: market.sourceUrl
      ? [market.sourceUrl, ...stringArrayFromMetadata(metadata, "sources")]
      : stringArrayFromMetadata(metadata, "sources"),
    coverImageDataUrl:
      market.imageUrl ||
      f1CoverImage ||
      market.homeLogoUrl ||
      market.leagueLogoUrl ||
      (typeof metadata.coverImageDataUrl === "string" ? metadata.coverImageDataUrl : undefined),
    homeLogoUrl: market.homeLogoUrl || undefined,
    awayLogoUrl: market.awayLogoUrl || undefined,
    homeName: market.homeName || undefined,
    awayName: market.awayName || undefined,
    creatorKey: market.creatorWalletAddress || undefined,
    participantWallets: Array.isArray(market.participants)
      ? market.participants.filter((participant): participant is string => typeof participant === "string")
      : [],
    adminNote: typeof metadata.adminNote === "string" ? metadata.adminNote : undefined,
    resolution:
      market.resolution === "yes" || market.resolution === "no" || market.resolution === "canceled"
        ? market.resolution
        : undefined,
    resolvedAt: market.resolvedAt || undefined,
    token: typeof metadata.token === "string" ? metadata.token : "cUSDT",
    status:
      status === "pending" || status === "open" || status === "declined" || status === "draft" || status === "resolved"
        ? status
        : undefined,
  };
};

const getEthereum = () => (globalThis as { ethereum?: EthereumProvider }).ethereum;

const sessionStorageKey = (walletAddress: string) => `${SESSION_STORAGE_PREFIX}${walletAddress.toLowerCase()}`;

const readStoredSession = (walletAddress: string): ApiSession | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionStorageKey(walletAddress));
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as ApiSession;
    if (
      session.walletAddress?.toLowerCase() !== walletAddress.toLowerCase() ||
      !session.token ||
      Date.parse(session.expiresAt) <= Date.now() + 30_000
    ) {
      window.localStorage.removeItem(sessionStorageKey(walletAddress));
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(sessionStorageKey(walletAddress));
    return null;
  }
};

const storeSession = (session: ApiSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sessionStorageKey(session.walletAddress), JSON.stringify(session));
};

const clearStoredSession = (walletAddress: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionStorageKey(walletAddress));
};

const signPersonalMessage = async (message: string, walletAddress: string) => {
  const ethereum = getEthereum();
  if (!ethereum?.request) {
    throw new Error("Wallet auth requires a browser wallet.");
  }

  const signature = await ethereum.request({
    method: "personal_sign",
    params: [message, walletAddress],
  });

  if (typeof signature !== "string") {
    throw new Error("Wallet did not return a request signature.");
  }

  return signature;
};

const loginSession = async (walletAddress: string): Promise<ApiSession> => {
  const normalizedWallet = walletAddress.toLowerCase();
  const nonceResponse = await fetch(`${API_BASE_URL}/api/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: normalizedWallet }),
  });
  if (!nonceResponse.ok) {
    const body = await nonceResponse.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "Unable to start wallet login.");
  }

  const challenge = (await nonceResponse.json()) as { nonce: string; message: string };
  const signature = await signPersonalMessage(challenge.message, walletAddress);
  const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: normalizedWallet, nonce: challenge.nonce, signature }),
  });
  if (!loginResponse.ok) {
    const body = await loginResponse.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "Unable to complete wallet login.");
  }

  const { session } = (await loginResponse.json()) as { session: ApiSession };
  storeSession(session);
  return session;
};

const ensureSession = async (walletAddress?: string): Promise<ApiSession | null> => {
  if (!walletAddress) return null;
  return readStoredSession(walletAddress) || loginSession(walletAddress);
};

const requestAuthHeaders = async (walletAddress?: string): Promise<Record<string, string>> => {
  const session = await ensureSession(walletAddress);
  if (!session) return {};
  return { Authorization: `Bearer ${session.token}` };
};

const request = async <T>(
  path: string,
  init?: RequestInit,
  authWalletAddress?: string,
  retried = false,
): Promise<T> => {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const authHeaders = await requestAuthHeaders(authWalletAddress);
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && authWalletAddress && !retried) {
      clearStoredSession(authWalletAddress);
      return request(path, init, authWalletAddress, true);
    }
    throw new Error(typeof body.error === "string" ? body.error : `DarkONNET API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const darkonnetApi = {
  baseUrl: API_BASE_URL,
  wsNotificationsUrl(walletAddress: string) {
    const wsBase = API_BASE_URL.replace(/^http/, "ws");
    return `${wsBase}/ws/notifications?walletAddress=${encodeURIComponent(walletAddress)}`;
  },
  async authenticatedWsNotificationsUrl(walletAddress: string) {
    const wsBase = API_BASE_URL.replace(/^http/, "ws");
    const path = "/ws/notifications";
    const session = await ensureSession(walletAddress);
    if (!session) throw new Error("Wallet auth requires a browser wallet.");

    return `${wsBase}${path}?walletAddress=${encodeURIComponent(walletAddress.toLowerCase())}&authSession=${encodeURIComponent(
      session.token,
    )}`;
  },
  async listMarkets(options: { includeEnded?: boolean } = {}) {
    const path = options.includeEnded ? "/api/markets?includeEnded=true" : "/api/markets";
    const { markets } = await request<{ markets: ApiMarket[] }>(path);
    return markets.map(mapApiMarket);
  },
  async getMarket(marketId: string) {
    const { market } = await request<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(marketId)}`);
    return mapApiMarket(market);
  },
  async upsertMarket(input: LocalMarket) {
    const backendMarketId = input.onchainMarketId || input.id;
    const { market } = await request<{ market: ApiMarket }>(
      `/api/markets/${encodeURIComponent(backendMarketId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          marketId: backendMarketId,
          onchainMarketId: input.onchainMarketId,
          slug: input.slug,
          category: input.category,
          title: input.question,
          imageUrl: isHttpUrl(input.coverImageDataUrl) ? input.coverImageDataUrl : undefined,
          creatorWalletAddress: input.creatorKey || undefined,
          status: input.status === "open" ? "accepted" : input.status,
          startsAt: input.endsAt,
          sourceUrl: input.sources[0],
          metadata: {
            rules: input.rules,
            sources: input.sources,
            creatorStake: input.creatorStake,
            token: input.token,
            yesProbability: input.yesProbability,
            encryptedVolumeLabel: input.encryptedVolumeLabel,
            tradingVolume: input.tradingVolume,
            signalLabel: input.signalLabel,
            adminNote: input.adminNote,
            coverImageDataUrl: input.coverImageDataUrl,
          },
        }),
      },
      input.creatorKey,
    );
    return mapApiMarket(market);
  },
  async updateMarketStatus(marketId: string, status: "open" | "declined", adminNote = "", adminWalletAddress?: string) {
    const current = await darkonnetApi.getMarket(marketId);
    const { market } = await request<{ market: ApiMarket }>(
      `/api/markets/${encodeURIComponent(marketId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          marketId,
          onchainMarketId: current.onchainMarketId,
          slug: current.slug,
          category: current.category,
          title: current.question,
          imageUrl: isHttpUrl(current.coverImageDataUrl) ? current.coverImageDataUrl : undefined,
          creatorWalletAddress: current.creatorKey,
          status: status === "open" ? "accepted" : "declined",
          startsAt: current.endsAt,
          metadata: {
            rules: current.rules,
            sources: current.sources || [],
            yesProbability: current.yesProbability,
            encryptedVolumeLabel: current.encryptedVolumeLabel,
            tradingVolume: current.tradingVolume,
            signalLabel: current.signalLabel,
            adminNote,
            coverImageDataUrl: current.coverImageDataUrl,
          },
        }),
      },
      adminWalletAddress,
    );
    return mapApiMarket(market);
  },
  async resolveMarket(
    marketId: string,
    resolution: "yes" | "no" | "canceled",
    adminNote = "",
    adminWalletAddress?: string,
  ) {
    const current = await darkonnetApi.getMarket(marketId);
    const { market } = await request<{ market: ApiMarket }>(
      `/api/markets/${encodeURIComponent(marketId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          marketId,
          onchainMarketId: current.onchainMarketId,
          slug: current.slug,
          category: current.category,
          title: current.question,
          imageUrl: isHttpUrl(current.coverImageDataUrl) ? current.coverImageDataUrl : undefined,
          creatorWalletAddress: current.creatorKey,
          status: "resolved",
          startsAt: current.endsAt,
          resolvedAt: new Date().toISOString(),
          resolution,
          metadata: {
            rules: current.rules,
            sources: current.sources || [],
            yesProbability: current.yesProbability,
            encryptedVolumeLabel: current.encryptedVolumeLabel,
            tradingVolume: current.tradingVolume,
            signalLabel: current.signalLabel,
            adminNote,
            resolution,
            coverImageDataUrl: current.coverImageDataUrl,
          },
        }),
      },
      adminWalletAddress,
    );
    return mapApiMarket(market);
  },
  async listComments(marketId: string) {
    const { comments } = await request<{ comments: ApiComment[] }>(
      `/api/markets/${encodeURIComponent(marketId)}/comments`,
    );
    return comments;
  },
  async createComment(input: {
    marketId: string;
    walletAddress: string;
    displayName: string;
    body: string;
    parentId?: string | null;
  }) {
    const { comment } = await request<{ comment: ApiComment }>(
      `/api/markets/${encodeURIComponent(input.marketId)}/comments`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      input.walletAddress,
    );
    return comment;
  },
  async setCommentLike(input: { marketId: string; commentId: string; walletAddress: string; liked: boolean }) {
    const { comment } = await request<{ comment: ApiComment; liked: boolean }>(
      `/api/markets/${encodeURIComponent(input.marketId)}/comments/${encodeURIComponent(input.commentId)}/like`,
      {
        method: "POST",
        body: JSON.stringify({ walletAddress: input.walletAddress, liked: input.liked }),
      },
      input.walletAddress,
    );
    return comment;
  },
  async addParticipant(marketId: string, walletAddress: string) {
    await request<{ market: ApiMarket }>(
      `/api/markets/${encodeURIComponent(marketId)}/participants`,
      {
        method: "POST",
        body: JSON.stringify({ walletAddress }),
      },
      walletAddress,
    );
  },
  async listNotifications(walletAddress: string) {
    const { notifications } = await request<{ notifications: ApiNotification[] }>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/notifications`,
      undefined,
      walletAddress,
    );
    return notifications;
  },
  async markNotificationRead(walletAddress: string, notificationId: string) {
    await request<{ notification: ApiNotification }>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/notifications/${encodeURIComponent(notificationId)}`,
      { method: "PATCH" },
      walletAddress,
    );
  },
  async getProfile(walletAddress: string) {
    const { profile } = await request<{ profile: ApiProfile }>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/profile`,
      undefined,
      walletAddress,
    );
    return profile;
  },
  async saveProfile(walletAddress: string, profile: Omit<ApiProfile, "walletAddress" | "createdAt" | "updatedAt">) {
    const { profile: savedProfile } = await request<{ profile: ApiProfile }>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/profile`,
      {
        method: "PUT",
        body: JSON.stringify(profile),
      },
      walletAddress,
    );
    return savedProfile;
  },
};
