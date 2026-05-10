import type { Chain } from "viem";
import { hardhat, sepolia } from "~~/utils/chains";

export type BaseConfig = {
  targetNetworks: readonly Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  infuraApiKey: string;
  rpcOverrides?: Record<number, readonly string[]>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

const rawInfuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY?.trim();
const rawAlchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY?.trim();
const parseRpcUrls = (value?: string) =>
  value
    ?.split(",")
    .map(url => url.trim())
    .filter(Boolean) ?? [];

if (rawInfuraKey?.startsWith("http")) {
  throw new Error("NEXT_PUBLIC_INFURA_API_KEY should contain only the API key, not the full Infura URL.");
}

if (!rawInfuraKey) {
  console.warn("NEXT_PUBLIC_INFURA_API_KEY is not set. Falling back to Alchemy, configured RPCs, or public RPCs.");
}

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: [sepolia, hardhat],
  // The interval at which your front-end polls the RPC servers for new data (it has no effect if you only target the local network (default is 4000))
  pollingInterval: 30000,
  // This is the Infura API key.
  // You can get your own at https://developer.metamask.io/
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: rawAlchemyKey || "",
  infuraApiKey: rawInfuraKey || "",
  // If you want to use a different RPC for a specific network, you can add it here.
  // The key is the chain ID, and the value is one or more HTTP RPC URLs.
  rpcOverrides: {
    [sepolia.id]: parseRpcUrls(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URLS),
  },
  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
