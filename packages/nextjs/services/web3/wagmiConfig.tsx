import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { createConfig } from "wagmi";
import scaffoldConfig, { ScaffoldConfig } from "~~/scaffold.config";
import { hardhat, mainnet } from "~~/utils/chains";
import { getAlchemyHttpUrl, getInfuraHttpUrl } from "~~/utils/helper";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

const uniqueRpcUrls = (urls: readonly (string | undefined)[]) => [
  ...new Set(urls.filter((url): url is string => Boolean(url))),
];
const RPC_TIMEOUT_MS = 12_000;

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors(),
  ssr: true,
  client: ({ chain }) => {
    const rpcOverrideUrls = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id] ?? [];
    const chainRpcUrls = chain.rpcUrls.default.http;
    const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
    const infuraHttpUrl = getInfuraHttpUrl(chain.id);
    const rpcFallbacks = uniqueRpcUrls([alchemyHttpUrl, ...rpcOverrideUrls, ...chainRpcUrls, infuraHttpUrl]).map(url =>
      http(url, {
        retryCount: 1,
        timeout: RPC_TIMEOUT_MS,
      }),
    );

    return createClient({
      chain,
      transport: fallback(
        rpcFallbacks.length > 0 ? rpcFallbacks : [http(undefined, { retryCount: 1, timeout: RPC_TIMEOUT_MS })],
      ),
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    });
  },
});
