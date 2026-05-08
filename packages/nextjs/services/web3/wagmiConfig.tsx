import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback, http } from "viem";
import { createConfig } from "wagmi";
import scaffoldConfig, { ScaffoldConfig } from "~~/scaffold.config";
import { hardhat, mainnet } from "~~/utils/chains";
import { getInfuraHttpUrl } from "~~/utils/helper";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors(),
  ssr: true,
  client: ({ chain }) => {
    let rpcFallbacks = [http()];
    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
    if (rpcOverrideUrl) {
      rpcFallbacks = [http(rpcOverrideUrl)];
    } else {
      const infuraHttpUrl = getInfuraHttpUrl(chain.id);
      if (infuraHttpUrl) {
        rpcFallbacks = [http(infuraHttpUrl)];
      }
    }
    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    });
  },
});
