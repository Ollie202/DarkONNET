export type MarketCategory =
  | "crypto"
  | "politics"
  | "sports"
  | "tech"
  | "culture"
  | "finance"
  | "geopolitics"
  | "esports";

export type Market = {
  id: string;
  question: string;
  category: MarketCategory;
  yesProbability: number;
  encryptedVolumeLabel: string;
  endsAt: string;
  signalLabel: string;
  sentimentSignals: {
    news: number;
    volume: number;
    crowd: number;
  };
  trending?: boolean;
  rules?: string;
  sources?: string[];
  coverImageDataUrl?: string;
  creatorStake?: number;
  creatorKey?: string;
  adminNote?: string;
  token?: string;
  status?: "draft" | "pending" | "open" | "declined";
};

export const mockMarkets: Market[] = [
  {
    id: "oil-100-june",
    question: "Will Brent crude trade above $100 before July 2026?",
    category: "finance",
    yesProbability: 0.57,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-06-30T23:59:00Z",
    signalLabel: "Energy shock watch",
    sentimentSignals: { news: 64, volume: 58, crowd: 49 },
    trending: true,
  },
  {
    id: "middle-east-supply",
    question: "Will Middle East shipping disruptions ease before August 2026?",
    category: "geopolitics",
    yesProbability: 0.38,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-07-31T23:59:00Z",
    signalLabel: "Shipping and conflict headlines",
    sentimentSignals: { news: 32, volume: 42, crowd: 39 },
    trending: true,
  },
  {
    id: "global-growth-31",
    question: "Will the IMF keep 2026 global growth at or above 3.1% in its next update?",
    category: "finance",
    yesProbability: 0.52,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-07-31T23:59:00Z",
    signalLabel: "IMF outlook baseline",
    sentimentSignals: { news: 51, volume: 55, crowd: 49 },
  },
  {
    id: "fed-cut-summer",
    question: "Will the Fed cut rates before the end of summer 2026?",
    category: "finance",
    yesProbability: 0.46,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-09-22T23:59:00Z",
    signalLabel: "Rates and inflation pricing",
    sentimentSignals: { news: 43, volume: 51, crowd: 44 },
    trending: true,
  },
  {
    id: "ai-stocks-correction",
    question: "Will major AI stocks see a 10% correction before Q4 2026?",
    category: "tech",
    yesProbability: 0.61,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-09-30T23:59:00Z",
    signalLabel: "Valuation risk chatter",
    sentimentSignals: { news: 68, volume: 59, crowd: 56 },
    trending: true,
  },
  {
    id: "btc-150k-2026",
    question: "Will BTC close above $150k by Dec. 31, 2026?",
    category: "crypto",
    yesProbability: 0.62,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Crypto momentum",
    sentimentSignals: { news: 57, volume: 68, crowd: 61 },
    trending: true,
  },
  {
    id: "us-midterms-house",
    question: "Will Republicans keep control of the U.S. House after the 2026 midterms?",
    category: "politics",
    yesProbability: 0.48,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-11-04T23:59:00Z",
    signalLabel: "Polling and turnout signals",
    sentimentSignals: { news: 47, volume: 50, crowd: 48 },
    trending: true,
  },
  {
    id: "ru-ua-ceasefire-2026",
    question: "Will a Russia-Ukraine ceasefire be signed in 2026?",
    category: "geopolitics",
    yesProbability: 0.31,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Diplomacy watch",
    sentimentSignals: { news: 29, volume: 34, crowd: 31 },
    trending: true,
  },
  {
    id: "argentina-wc-2026",
    question: "Will Argentina win the 2026 FIFA World Cup?",
    category: "sports",
    yesProbability: 0.18,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-07-19T23:59:00Z",
    signalLabel: "Tournament odds",
    sentimentSignals: { news: 19, volume: 22, crowd: 17 },
  },
  {
    id: "frontier-ai-release",
    question: "Will a frontier AI lab release a new flagship model before Q4 2026?",
    category: "tech",
    yesProbability: 0.54,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-09-30T23:59:00Z",
    signalLabel: "AI release cycle",
    sentimentSignals: { news: 58, volume: 50, crowd: 54 },
    trending: true,
  },
  {
    id: "swift-tour-2026",
    question: "Will Taylor Swift announce a new tour in 2026?",
    category: "culture",
    yesProbability: 0.55,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Entertainment cycle",
    sentimentSignals: { news: 53, volume: 61, crowd: 51 },
  },
  {
    id: "eth-flippening",
    question: "Will ETH market cap flip BTC this cycle?",
    category: "crypto",
    yesProbability: 0.07,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Relative crypto flows",
    sentimentSignals: { news: 8, volume: 12, crowd: 6 },
  },
  {
    id: "starship-orbit-return",
    question: "Will SpaceX Starship complete an orbital mission and return intact in 2026?",
    category: "tech",
    yesProbability: 0.71,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Launch cadence",
    sentimentSignals: { news: 74, volume: 69, crowd: 70 },
  },
  {
    id: "red-sea-normalizes",
    question: "Will Red Sea shipping normalize before the end of 2026?",
    category: "geopolitics",
    yesProbability: 0.36,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Freight and security reports",
    sentimentSignals: { news: 34, volume: 37, crowd: 36 },
  },
  {
    id: "sol-etf-2026",
    question: "Will the SEC approve a spot Solana ETF in 2026?",
    category: "crypto",
    yesProbability: 0.41,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "ETF approval watch",
    sentimentSignals: { news: 39, volume: 45, crowd: 40 },
  },
  {
    id: "nba-finals-east",
    question: "Will an Eastern Conference team win the 2026 NBA Finals?",
    category: "sports",
    yesProbability: 0.51,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-06-20T23:59:00Z",
    signalLabel: "Playoff form",
    sentimentSignals: { news: 52, volume: 48, crowd: 53 },
  },
  {
    id: "apple-ai-device",
    question: "Will Apple announce a major AI hardware product in 2026?",
    category: "tech",
    yesProbability: 0.33,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Product rumor flow",
    sentimentSignals: { news: 31, volume: 35, crowd: 33 },
  },
  {
    id: "uk-election-2026",
    question: "Will the UK hold a general election before 2027?",
    category: "politics",
    yesProbability: 0.49,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Westminster pressure",
    sentimentSignals: { news: 50, volume: 46, crowd: 51 },
  },
  {
    id: "drake-album-2026",
    question: "Will Drake release a new studio album in 2026?",
    category: "culture",
    yesProbability: 0.62,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Streaming and label chatter",
    sentimentSignals: { news: 59, volume: 64, crowd: 63 },
  },
  {
    id: "lol-worlds-korea",
    question: "Will a Korean team win League of Legends Worlds 2026?",
    category: "esports",
    yesProbability: 0.66,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-11-15T23:59:00Z",
    signalLabel: "Regional strength",
    sentimentSignals: { news: 65, volume: 62, crowd: 70 },
    trending: true,
  },
  {
    id: "us-recession-2026",
    question: "Will a U.S. recession be officially declared in 2026?",
    category: "finance",
    yesProbability: 0.28,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Growth and jobs data",
    sentimentSignals: { news: 27, volume: 31, crowd: 26 },
  },
  {
    id: "tesla-robotaxi-5",
    question: "Will Tesla robotaxi service launch in 5+ U.S. cities by year end?",
    category: "tech",
    yesProbability: 0.31,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Autonomy rollout watch",
    sentimentSignals: { news: 35, volume: 29, crowd: 30 },
  },
  {
    id: "taiwan-strait-incident",
    question: "Will a major Taiwan Strait military incident be reported in 2026?",
    category: "geopolitics",
    yesProbability: 0.19,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-12-31T23:59:00Z",
    signalLabel: "Regional security watch",
    sentimentSignals: { news: 22, volume: 17, crowd: 18 },
  },
  {
    id: "csgo-major-eu",
    question: "Will a European team win the next Counter-Strike major?",
    category: "esports",
    yesProbability: 0.58,
    encryptedVolumeLabel: "Encrypted",
    endsAt: "2026-09-30T23:59:00Z",
    signalLabel: "Roster form",
    sentimentSignals: { news: 55, volume: 57, crowd: 62 },
  },
];

export const formatTimeRemaining = (endsAt: string, now: Date = new Date()): string => {
  const end = new Date(endsAt).getTime();
  const diffMs = end - now.getTime();
  if (diffMs <= 0) return "ended";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days >= 365) return `${Math.floor(days / 365)}y`;
  if (days >= 30) return `${Math.floor(days / 30)}mo`;
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  return `${hours}h`;
};

export const formatMarketVolume = (market: Pick<Market, "id" | "encryptedVolumeLabel">): string => {
  if (market.encryptedVolumeLabel && market.encryptedVolumeLabel !== "Encrypted") return market.encryptedVolumeLabel;

  const seed = [...market.id].reduce((total, character) => total + character.charCodeAt(0), 0);
  const volume = 25_000 + seed * 730;
  return `${volume.toLocaleString()} cUSDT`;
};
