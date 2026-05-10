import type { Chain } from "viem";
import scaffoldConfig from "~~/scaffold.config";
import { configuredChains, hardhat, mainnet, sepolia } from "~~/utils/chains";

type ChainAttributes = {
  // color | [lightThemeColor, darkThemeColor]
  color: string | [string, string];
  // Used to fetch price by providing mainnet token address
  // for networks having native currency other than ETH
  nativeCurrencyTokenAddress?: string;
};

export type ChainWithAttributes = Chain & Partial<ChainAttributes>;
export type AllowedChainIds = (typeof scaffoldConfig.targetNetworks)[number]["id"];

// Mapping of chainId to Infura RPC subdomain names
export const RPC_CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: "mainnet",
  [sepolia.id]: "sepolia",
  5: "eth-goerli",
  10: "optimism-mainnet",
  420: "opt-goerli",
  11155420: "optimism-sepolia",
  42161: "arbitrum-mainnet",
  421613: "arb-goerli",
  421614: "arbitrum-sepolia",
  137: "polygon-mainnet",
  80001: "polygon-mumbai",
  80002: "polygon-amoy",
  592: "astar-mainnet",
  1101: "polygonzkevm-mainnet",
  1442: "polygonzkevm-testnet",
  8453: "base-mainnet",
  84531: "base-goerli",
  84532: "base-sepolia",
  42220: "celo-mainnet",
  44787: "celo-sepolia",
};

export const getInfuraHttpUrl = (chainId: number) => {
  return scaffoldConfig.infuraApiKey && RPC_CHAIN_NAMES[chainId]
    ? `https://${RPC_CHAIN_NAMES[chainId]}.infura.io/v3/${scaffoldConfig.infuraApiKey}`
    : undefined;
};

export const getAlchemyHttpUrl = (chainId: number) => {
  if (!scaffoldConfig.alchemyApiKey) return undefined;

  if (scaffoldConfig.alchemyApiKey.startsWith("http")) {
    return chainId === sepolia.id ? scaffoldConfig.alchemyApiKey : undefined;
  }

  if (chainId === mainnet.id) {
    return `https://eth-mainnet.g.alchemy.com/v2/${scaffoldConfig.alchemyApiKey}`;
  }

  if (chainId === sepolia.id) {
    return `https://eth-sepolia.g.alchemy.com/v2/${scaffoldConfig.alchemyApiKey}`;
  }

  return undefined;
};

export const NETWORKS_EXTRA_DATA: Record<string, ChainAttributes> = {
  [hardhat.id]: {
    color: "#b8af0c",
  },
  [mainnet.id]: {
    color: "#ff8b9e",
  },
  [sepolia.id]: {
    color: ["#5f4bb6", "#87ff65"],
  },
  100: {
    color: "#48a9a6",
  },
  137: {
    color: "#2bbdf7",
    nativeCurrencyTokenAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  },
  80001: {
    color: "#92D9FA",
    nativeCurrencyTokenAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  },
  11155420: {
    color: "#f01a37",
  },
  10: {
    color: "#f01a37",
  },
  421614: {
    color: "#28a0f0",
  },
  42161: {
    color: "#28a0f0",
  },
  250: {
    color: "#1969ff",
  },
  4002: {
    color: "#1969ff",
  },
  534351: {
    color: "#fbebd4",
  },
  42220: {
    color: "#FCFF52",
  },
  44787: {
    color: "#476520",
  },
};

/**
 * Gives the block explorer transaction URL, returns empty string if the network is a local chain
 */
export function getBlockExplorerTxLink(chainId: number, txnHash: string) {
  const targetChain = configuredChains.find(chain => chain.id === chainId);
  const blockExplorerTxURL = targetChain?.blockExplorers?.default?.url;

  if (!blockExplorerTxURL) {
    return "";
  }

  return `${blockExplorerTxURL}/tx/${txnHash}`;
}

/**
 * Gives the block explorer URL for a given address.
 * Defaults to Etherscan if no (wagmi) block explorer is configured for the network.
 */
export function getBlockExplorerAddressLink(network: Chain, address: string) {
  const blockExplorerBaseURL = network.blockExplorers?.default?.url;
  if (network.id === hardhat.id) {
    return `/blockexplorer/address/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://etherscan.io/address/${address}`;
  }

  return `${blockExplorerBaseURL}/address/${address}`;
}

/**
 * @returns targetNetworks array containing networks configured in scaffold.config including extra network metadata
 */
export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map(targetNetwork => ({
    ...targetNetwork,
    ...NETWORKS_EXTRA_DATA[targetNetwork.id],
  }));
}
