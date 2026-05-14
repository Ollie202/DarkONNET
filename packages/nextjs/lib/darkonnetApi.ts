import { getAddress } from "viem";
import { type LocalMarket } from "~~/lib/localMarkets";
import { type Market, type MarketCategory, parseMarketVolume } from "~~/lib/mockMarkets";

const defaultApiBaseUrl = "https://darkonnet-backend-production.up.railway.app";
const apiBaseUrl = (process.env.NEXT_PUBLIC_DARKONNET_API_URL || defaultApiBaseUrl).replace(/\/+$/, "");
const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const getSupabase = async () => {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase public env is not configured.");
  }
  const { createClient } = await import("~~/utils/supabase/client");
  return createClient();
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

const normalizeWalletAddress = (walletAddress: string) => getAddress(walletAddress).toLowerCase();

const signAuthMessage = async (walletAddress: string, message: string) => {
  const ethereum = typeof window !== "undefined" ? (window as any).ethereum : undefined;
  if (!ethereum?.request) throw new Error("Wallet provider is not available for backend authentication.");

  return ethereum.request({
    method: "personal_sign",
    params: [message, walletAddress],
  }) as Promise<string>;
};

type ApiSession = {
  token: string;
  walletAddress: string;
  expiresAt: string;
};

const sessionStorageKey = (walletAddress: string) => `darkonnet:api-session:${normalizeWalletAddress(walletAddress)}`;

const getStoredSession = (walletAddress: string): ApiSession | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionStorageKey(walletAddress));
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as ApiSession;
    if (!session.token || Date.parse(session.expiresAt) <= Date.now() + 60_000) {
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

const createApiSession = async (walletAddress: string): Promise<ApiSession> => {
  const nonceResponse = await fetch(`${apiBaseUrl}/api/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  const noncePayload = await nonceResponse.json().catch(() => ({}));
  if (!nonceResponse.ok) throw new Error(noncePayload.error || "Unable to create backend auth nonce.");

  const signature = await signAuthMessage(walletAddress, noncePayload.message);
  const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      nonce: noncePayload.nonce,
      signature,
    }),
  });
  const loginPayload = await loginResponse.json().catch(() => ({}));
  if (!loginResponse.ok) throw new Error(loginPayload.error || "Unable to create backend auth session.");

  const session = loginPayload.session as ApiSession;
  storeSession(session);
  return session;
};

const getApiSession = async (walletAddress: string) =>
  getStoredSession(walletAddress) || createApiSession(walletAddress);

const apiRequest = async <T>(
  path: string,
  {
    method = "GET",
    body,
    walletAddress,
    retryingAfterSessionRefresh = false,
  }: {
    method?: "GET" | "POST" | "PUT" | "PATCH";
    body?: unknown;
    walletAddress?: string;
    retryingAfterSessionRefresh?: boolean;
  } = {},
): Promise<T> => {
  const rawBody = body === undefined ? "" : JSON.stringify(body);
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (walletAddress) {
    const session = await getApiSession(walletAddress);
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : rawBody,
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && walletAddress && !retryingAfterSessionRefresh) {
    clearStoredSession(walletAddress);
    return apiRequest<T>(path, { method, body, walletAddress, retryingAfterSessionRefresh: true });
  }
  if (!response.ok) throw new Error(payload.error || `DarkONNET API request failed with ${response.status}`);
  return payload as T;
};

const mapApiMarket = (market: ApiMarket): Market => {
  const metadata = market.metadata || {};
  const category = normalizeCategory(market.category);
  const sportType = category === "sports" ? normalizeSportType(market) : undefined;
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
      "Supabase market metadata",
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
      market.imageUrl || (typeof metadata.coverImageDataUrl === "string" ? metadata.coverImageDataUrl : undefined),
    homeLogoUrl: market.homeLogoUrl || undefined,
    awayLogoUrl: market.awayLogoUrl || undefined,
    homeName: market.homeName || undefined,
    awayName: market.awayName || undefined,
    creatorKey: market.creatorWalletAddress || undefined,
    participantWallets: [],
    adminNote: typeof metadata.adminNote === "string" ? metadata.adminNote : undefined,
    resolution:
      market.resolution === "yes" || market.resolution === "no" || market.resolution === "canceled"
        ? (market.resolution as any)
        : undefined,
    resolvedAt: market.resolvedAt || undefined,
    token: typeof metadata.token === "string" ? metadata.token : "cUSDT",
    status:
      status === "pending" || status === "open" || status === "declined" || status === "draft" || status === "resolved"
        ? status
        : undefined,
  };
};

const mapSupabaseCommentToApi = (comment: any): ApiComment => ({
  id: comment.id,
  marketId: comment.market_id,
  parentId: comment.parent_id,
  walletAddress: comment.wallet_address,
  displayName: comment.display_name,
  body: comment.body,
  likedBy: comment.liked_by || [],
  createdAt: comment.created_at,
  updatedAt: comment.updated_at,
});

const mapSupabaseProfileToApi = (profile: any): ApiProfile => ({
  walletAddress: profile.wallet_address,
  profileName: profile.profile_name || "",
  bio: profile.bio || "",
  email: profile.email || "",
  profileImageDataUrl: profile.profile_image_data_url || "",
  receiveUpdates: profile.receive_updates ?? true,
  receivePositionNotifications: profile.receive_position_notifications ?? true,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const getProfileFromSupabase = async (walletAddress: string) => {
  const supabase = await getSupabase();
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", normalizedWallet)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapSupabaseProfileToApi(data);

  return {
    walletAddress: normalizedWallet,
    profileName: "",
    bio: "",
    email: "",
    profileImageDataUrl: "",
    receiveUpdates: true,
    receivePositionNotifications: true,
  } satisfies ApiProfile;
};

const saveProfileInSupabase = async (
  walletAddress: string,
  profile: Omit<ApiProfile, "walletAddress" | "createdAt" | "updatedAt">,
) => {
  const supabase = await getSupabase();
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        wallet_address: normalizedWallet,
        profile_name: profile.profileName,
        bio: profile.bio,
        email: profile.email,
        profile_image_data_url: profile.profileImageDataUrl,
        receive_updates: profile.receiveUpdates,
        receive_position_notifications: profile.receivePositionNotifications,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet_address" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseProfileToApi(data);
};

const createCommentInSupabase = async (input: {
  marketId: string;
  walletAddress: string;
  displayName: string;
  body: string;
  parentId?: string | null;
}) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      market_id: input.marketId,
      wallet_address: input.walletAddress.toLowerCase(),
      display_name: input.displayName,
      body: input.body,
      parent_id: input.parentId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSupabaseCommentToApi(data);
};

const setCommentLikeInSupabase = async (input: {
  marketId: string;
  commentId: string;
  walletAddress: string;
  liked: boolean;
}) => {
  const supabase = await getSupabase();
  const { data: current } = await supabase.from("comments").select("liked_by").eq("id", input.commentId).single();
  let likedBy = current?.liked_by || [];
  const walletAddress = input.walletAddress.toLowerCase();
  if (input.liked) {
    if (!likedBy.includes(walletAddress)) likedBy.push(walletAddress);
  } else {
    likedBy = likedBy.filter((wallet: string) => wallet !== walletAddress);
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ liked_by: likedBy })
    .eq("id", input.commentId)
    .select()
    .single();
  if (error) throw error;
  return mapSupabaseCommentToApi(data);
};

export const darkonnetApi = {
  baseUrl: apiBaseUrl,
  wsNotificationsUrl(walletAddress: string) {
    return `${apiBaseUrl.replace(/^http/i, "ws")}/ws/notifications?walletAddress=${encodeURIComponent(walletAddress)}`;
  },
  async authenticatedWsNotificationsUrl(walletAddress: string) {
    const path = "/ws/notifications";
    const session = await getApiSession(walletAddress);
    const params = new URLSearchParams({
      walletAddress: normalizeWalletAddress(walletAddress),
      authSession: session.token,
    });
    return `${apiBaseUrl.replace(/^http/i, "ws")}${path}?${params.toString()}`;
  },
  async listMarkets(options: { includeEnded?: boolean } = {}) {
    const params = options.includeEnded ? "?includeEnded=true" : "";
    const { markets } = await apiRequest<{ markets: ApiMarket[] }>(`/api/markets${params}`);
    return markets.map(mapApiMarket);
  },
  async getMarket(marketId: string) {
    const { market } = await apiRequest<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(marketId)}`);
    return mapApiMarket(market);
  },
  async upsertMarket(input: LocalMarket) {
    const backendMarketId = input.onchainMarketId || input.id;
    const marketData = {
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
    };

    const { market } = await apiRequest<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(backendMarketId)}`, {
      method: "PUT",
      body: marketData,
      walletAddress: input.creatorKey,
    });
    return mapApiMarket(market);
  },
  async updateMarketStatus(
    marketId: string,
    status: "open" | "declined",
    adminNote = "",
    _adminWalletAddress?: string,
  ) {
    const existing = await apiRequest<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(marketId)}`);
    const { market } = await apiRequest<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(marketId)}`, {
      method: "PUT",
      body: {
        ...existing.market,
        marketId,
        status: status === "open" ? "accepted" : "declined",
        metadata: { ...(existing.market.metadata || {}), adminNote },
      },
      walletAddress: _adminWalletAddress,
    });
    return mapApiMarket(market);
  },
  async resolveMarket(
    marketId: string,
    resolution: "yes" | "no" | "canceled",
    adminNote = "",
    _adminWalletAddress?: string,
  ) {
    const existing = await apiRequest<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(marketId)}`);
    const { market } = await apiRequest<{ market: ApiMarket }>(`/api/markets/${encodeURIComponent(marketId)}`, {
      method: "PUT",
      body: {
        ...existing.market,
        marketId,
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolution,
        metadata: { ...(existing.market.metadata || {}), adminNote, resolution },
      },
      walletAddress: _adminWalletAddress,
    });
    return mapApiMarket(market);
  },
  async listComments(marketId: string) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("market_id", marketId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const mapComment = (c: any): ApiComment => ({
      id: c.id,
      marketId: c.market_id,
      parentId: c.parent_id,
      walletAddress: c.wallet_address,
      displayName: c.display_name,
      body: c.body,
      likedBy: c.liked_by || [],
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    });

    return (data || []).map(mapComment);
  },
  async createComment(input: {
    marketId: string;
    walletAddress: string;
    displayName: string;
    body: string;
    parentId?: string | null;
  }) {
    try {
      const { comment } = await apiRequest<{ comment: ApiComment }>(
        `/api/markets/${encodeURIComponent(input.marketId)}/comments`,
        {
          method: "POST",
          body: input,
          walletAddress: input.walletAddress,
        },
      );
      return comment;
    } catch {
      return createCommentInSupabase(input);
    }
  },
  async setCommentLike(input: { marketId: string; commentId: string; walletAddress: string; liked: boolean }) {
    try {
      const { comment } = await apiRequest<{ comment: ApiComment }>(
        `/api/markets/${encodeURIComponent(input.marketId)}/comments/${encodeURIComponent(input.commentId)}/like`,
        {
          method: "POST",
          body: { walletAddress: input.walletAddress, liked: input.liked },
          walletAddress: input.walletAddress,
        },
      );
      return comment;
    } catch {
      return setCommentLikeInSupabase(input);
    }
  },
  async listNotifications(walletAddress: string) {
    const { notifications } = await apiRequest<{ notifications: ApiNotification[] }>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/notifications`,
      { walletAddress },
    );
    return notifications;
  },
  async markNotificationRead(walletAddress: string, notificationId: string) {
    await apiRequest<{ notification: ApiNotification }>(
      `/api/wallets/${encodeURIComponent(walletAddress)}/notifications/${encodeURIComponent(notificationId)}`,
      {
        method: "PATCH",
        body: {},
        walletAddress,
      },
    );
  },
  async getProfile(walletAddress: string) {
    try {
      const { profile } = await apiRequest<{ profile: ApiProfile }>(
        `/api/wallets/${encodeURIComponent(walletAddress)}/profile`,
        { walletAddress },
      );
      return profile;
    } catch (error) {
      console.warn("Unable to load backend profile, falling back to Supabase profile read.", error);
      return getProfileFromSupabase(walletAddress);
    }
  },
  async saveProfile(walletAddress: string, profile: Omit<ApiProfile, "walletAddress" | "createdAt" | "updatedAt">) {
    try {
      const { profile: savedProfile } = await apiRequest<{ profile: ApiProfile }>(
        `/api/wallets/${encodeURIComponent(walletAddress)}/profile`,
        {
          method: "PUT",
          body: profile,
          walletAddress,
        },
      );
      return savedProfile;
    } catch (error) {
      console.warn("Unable to save backend profile, falling back to Supabase profile write.", error);
      return saveProfileInSupabase(walletAddress, profile);
    }
  },
};
