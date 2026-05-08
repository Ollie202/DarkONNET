import { type LocalMarket } from "~~/lib/localMarkets";
import { type Market, type MarketCategory, parseMarketVolume } from "~~/lib/mockMarkets";
import { createClient } from "~~/utils/supabase/client";

const supabase = createClient();

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
      market.imageUrl ||
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
        ? market.resolution as any
        : undefined,
    resolvedAt: market.resolvedAt || undefined,
    token: typeof metadata.token === "string" ? metadata.token : "cUSDT",
    status:
      status === "pending" || status === "open" || status === "declined" || status === "draft" || status === "resolved"
        ? status
        : undefined,
  };
};

const mapSupabaseMarketToApi = (m: any): ApiMarket => ({
  marketId: m.market_id,
  onchainMarketId: m.onchain_market_id,
  slug: m.slug,
  category: m.category,
  title: m.title,
  description: m.description,
  provider: m.provider,
  imageUrl: m.image_url,
  homeName: m.home_name,
  awayName: m.away_name,
  homeLogoUrl: m.home_logo_url,
  awayLogoUrl: m.away_logo_url,
  leagueName: m.league_name,
  leagueLogoUrl: m.league_logo_url,
  sourceUrl: m.source_url,
  sourceName: m.source_name,
  startsAt: m.starts_at,
  creatorWalletAddress: m.creator_wallet_address,
  status: m.status,
  acceptedAt: m.accepted_at,
  resolvedAt: m.resolved_at,
  resolution: m.resolution,
  participants: m.participants,
  metadata: m.metadata,
  createdAt: m.created_at,
  updatedAt: m.updated_at,
});

export const darkonnetApi = {
  baseUrl: "supabase",
  wsNotificationsUrl(walletAddress: string) {
    return `supabase-realtime:${walletAddress}`;
  },
  async authenticatedWsNotificationsUrl(walletAddress: string) {
    return `supabase-realtime:${walletAddress}`;
  },
  async listMarkets(options: { includeEnded?: boolean } = {}) {
    let query = supabase.from("markets").select("*");
    if (!options.includeEnded) {
      // Filter logic if needed, but usually we handle in UI
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSupabaseMarketToApi).map(mapApiMarket);
  },
  async getMarket(marketId: string) {
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .or(`market_id.eq.${marketId},onchain_market_id.eq.${marketId}`)
      .single();
    if (error) throw error;
    return mapApiMarket(mapSupabaseMarketToApi(data));
  },
  async upsertMarket(input: LocalMarket) {
    const backendMarketId = input.onchainMarketId || input.id;
    const marketData = {
      market_id: backendMarketId,
      onchain_market_id: input.onchainMarketId,
      slug: input.slug,
      category: input.category,
      title: input.question,
      image_url: isHttpUrl(input.coverImageDataUrl) ? input.coverImageDataUrl : undefined,
      creator_wallet_address: input.creatorKey || undefined,
      status: input.status === "open" ? "accepted" : input.status,
      starts_at: input.endsAt,
      source_url: input.sources[0],
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

    const { data, error } = await supabase.from("markets").upsert(marketData).select().single();
    if (error) throw error;
    return mapApiMarket(mapSupabaseMarketToApi(data));
  },
  async updateMarketStatus(marketId: string, status: "open" | "declined", adminNote = "", _adminWalletAddress?: string) {
    const { data, error } = await supabase
      .from("markets")
      .update({
        status: status === "open" ? "accepted" : "declined",
        metadata: { adminNote },
      })
      .eq("market_id", marketId)
      .select()
      .single();
    if (error) throw error;
    return mapApiMarket(mapSupabaseMarketToApi(data));
  },
  async resolveMarket(
    marketId: string,
    resolution: "yes" | "no" | "canceled",
    adminNote = "",
    _adminWalletAddress?: string,
  ) {
    const { data, error } = await supabase
      .from("markets")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution,
        metadata: { adminNote, resolution },
      })
      .eq("market_id", marketId)
      .select()
      .single();
    if (error) throw error;
    return mapApiMarket(mapSupabaseMarketToApi(data));
  },
  async listComments(marketId: string) {
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
    return data;
  },
  async setCommentLike(input: { marketId: string; commentId: string; walletAddress: string; liked: boolean }) {
    const { data: current } = await supabase.from("comments").select("liked_by").eq("id", input.commentId).single();
    let likedBy = current?.liked_by || [];
    if (input.liked) {
      if (!likedBy.includes(input.walletAddress)) likedBy.push(input.walletAddress);
    } else {
      likedBy = likedBy.filter((w: string) => w !== input.walletAddress);
    }
    const { data, error } = await supabase
      .from("comments")
      .update({ liked_by: likedBy })
      .eq("id", input.commentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async addParticipant(marketId: string, walletAddress: string) {
    const { data: current } = await supabase.from("markets").select("participants").eq("market_id", marketId).single();
    let participants = current?.participants || [];
    if (!participants.includes(walletAddress)) {
      participants.push(walletAddress);
      await supabase.from("markets").update({ participants }).eq("market_id", marketId);
    }
  },
  async listNotifications(walletAddress: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .order("created_at", { ascending: false });
    if (error) throw error;
    
    return (data || []).map(n => ({
      id: n.id,
      walletAddress: n.wallet_address,
      type: n.type,
      title: n.title,
      body: n.body,
      marketId: n.market_id,
      commentId: n.comment_id,
      metadata: n.metadata,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));
  },
  async markNotificationRead(walletAddress: string, notificationId: string) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("wallet_address", walletAddress.toLowerCase());
  },
  async getProfile(walletAddress: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return { walletAddress, profileName: "", bio: "", email: "", profileImageDataUrl: "", receiveUpdates: true, receivePositionNotifications: true };
    
    return {
      walletAddress: data.wallet_address,
      profileName: data.profile_name,
      bio: data.bio,
      email: data.email,
      profileImageDataUrl: data.profile_image_data_url,
      receiveUpdates: data.receive_updates,
      receivePositionNotifications: data.receive_position_notifications,
    };
  },
  async saveProfile(walletAddress: string, profile: Omit<ApiProfile, "walletAddress" | "createdAt" | "updatedAt">) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        profile_name: profile.profileName,
        bio: profile.bio,
        email: profile.email,
        profile_image_data_url: profile.profileImageDataUrl,
        receive_updates: profile.receiveUpdates,
        receive_position_notifications: profile.receivePositionNotifications,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      walletAddress: data.wallet_address,
      profileName: data.profile_name,
      bio: data.bio,
      email: data.email,
      profileImageDataUrl: data.profile_image_data_url,
      receiveUpdates: data.receive_updates,
      receivePositionNotifications: data.receive_position_notifications,
    };
  },
};
