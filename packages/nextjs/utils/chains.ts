import type { Chain } from "viem";

export const mainnet = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth.merkle.io"] },
    public: { http: ["https://eth.merkle.io"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://etherscan.io" },
  },
} as const satisfies Chain;

export const sepolia = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
    public: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
} as const satisfies Chain;

export const hardhat = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
} as const satisfies Chain;

export const base = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] }, public: { http: ["https://mainnet.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
} as const satisfies Chain;

export const baseSepolia = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] }, public: { http: ["https://sepolia.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://sepolia.basescan.org" } },
  testnet: true,
} as const satisfies Chain;

export const avalanche = {
  id: 43114,
  name: "Avalanche",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
    public: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
  },
  blockExplorers: { default: { name: "SnowTrace", url: "https://snowtrace.io" } },
} as const satisfies Chain;

export const arbitrum = {
  id: 42161,
  name: "Arbitrum One",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] }, public: { http: ["https://arb1.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://arbiscan.io" } },
} as const satisfies Chain;

export const polygon = {
  id: 137,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://polygon-rpc.com"] }, public: { http: ["https://polygon-rpc.com"] } },
  blockExplorers: { default: { name: "Polygonscan", url: "https://polygonscan.com" } },
} as const satisfies Chain;

export const bsc = {
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://bsc-dataseed.bnbchain.org"] },
    public: { http: ["https://bsc-dataseed.bnbchain.org"] },
  },
  blockExplorers: { default: { name: "BscScan", url: "https://bscscan.com" } },
} as const satisfies Chain;

export const zora = {
  id: 7777777,
  name: "Zora",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.zora.energy"] }, public: { http: ["https://rpc.zora.energy"] } },
  blockExplorers: { default: { name: "Zora Explorer", url: "https://explorer.zora.energy" } },
} as const satisfies Chain;

export const optimism = {
  id: 10,
  name: "OP Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.optimism.io"] }, public: { http: ["https://mainnet.optimism.io"] } },
  blockExplorers: { default: { name: "Optimistic Etherscan", url: "https://optimistic.etherscan.io" } },
} as const satisfies Chain;

export const optimismSepolia = {
  id: 11155420,
  name: "OP Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.optimism.io"] }, public: { http: ["https://sepolia.optimism.io"] } },
  blockExplorers: { default: { name: "Optimistic Etherscan", url: "https://sepolia-optimism.etherscan.io" } },
  testnet: true,
} as const satisfies Chain;

export const configuredChains: readonly Chain[] = [mainnet, sepolia, hardhat];
