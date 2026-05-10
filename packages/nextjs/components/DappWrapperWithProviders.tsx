"use client";

import { Component, useEffect, useMemo, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { IndexedDBStorage, RelayerWeb, SepoliaConfig, type ZamaSDKEvent } from "@zama-fhe/sdk";
import { RelayerCleartext, hardhatCleartextConfig } from "@zama-fhe/sdk/cleartext";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, useAccount, useChainId, useReconnect } from "wagmi";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/helper";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
// Swap to `@zama-fhe/react-sdk/wagmi` once a patched stable ships — the fix
// is already in the alpha track (≥ 3.0.0-alpha.16). See wagmiSigner.ts.
import { WagmiSigner } from "~~/services/web3/wagmiSigner";
import { rememberPersistentWalletConnection, shouldPersistWalletConnection } from "~~/services/web3/walletPersistence";

// Module-scoped — the signer, keypair store and session store are chain-agnostic
// and there's no reason to rebuild them on chain change. IndexedDBStorage lets
// the keypair + EIP-712 session survive page reloads, matching Zama's hosted
// app patterns.
const signer = new WagmiSigner({ config: wagmiConfig });
const storage = new IndexedDBStorage("KeypairStore", 1);
const sessionStorage = new IndexedDBStorage("SignatureStore", 1);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Swap RelayerCleartext for local anvil (31337), RelayerWeb for real networks.
// Rebuild on chain change so the right transport/worker is in place.
const ZamaRuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const chainId = useChainId();

  const relayer = useMemo(() => {
    if (chainId === 31337) {
      return new RelayerCleartext(hardhatCleartextConfig);
    }
    return new RelayerWeb({
      getChainId: () => signer.getChainId(),
      transports: {
        [SepoliaConfig.chainId]: SepoliaConfig,
      },
    });
  }, [chainId]);

  useEffect(() => {
    return () => {
      relayer.terminate();
    };
  }, [relayer]);

  function dispatchEvent(event: ZamaSDKEvent) {
    window.dispatchEvent(new CustomEvent(event.type, { detail: event }));
  }

  return (
    <ZamaProvider
      relayer={relayer}
      signer={signer}
      storage={storage}
      sessionStorage={sessionStorage}
      onEvent={dispatchEvent}
    >
      {children}
    </ZamaProvider>
  );
};

const isMetaMaskConnectFailure = (reason: unknown) => {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : typeof reason === "object" && reason && "message" in reason
          ? String((reason as { message?: unknown }).message)
          : "";

  return /failed to connect to metamask/i.test(message);
};

const normalizeRuntimeMessage = (reason: unknown) => {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  if (typeof reason === "object" && reason && "message" in reason) {
    return String((reason as { message?: unknown }).message || "Unknown runtime error");
  }
  return "Unknown runtime error";
};

const isWalletExtensionFailure = (reason: unknown, source = "") => {
  const message = normalizeRuntimeMessage(reason);
  return (
    /metamask|walletconnect|inpage\.js|user rejected|resource unavailable|disconnected port object/i.test(message) ||
    /chrome-extension:\/\/nkbihfbeogaeaoehlefnkodbefgpgknn/i.test(source)
  );
};

class ProviderErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Provider tree failed to render cleanly.", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center text-center p-8">
          <div>
            <p className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
              Something went wrong loading the app.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-[#FFD60A] px-4 py-2 text-sm font-semibold text-[#0A0A0A]"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

let lastWalletToastTime = 0;

const showWalletExtensionToast = (reason: unknown) => {
  const now = Date.now();
  if (now - lastWalletToastTime < 10000) return; // Prevent spamming in console

  if (isMetaMaskConnectFailure(reason)) {
    lastWalletToastTime = now;
    // We log this to the console instead of showing a toast to prevent background noise
    // from interrupting the user's browsing experience.
    console.warn(
      "FHE SDK: MetaMask connection is required for encrypted features but is currently locked or unavailable.",
    );
  }
};

const WalletErrorShield = () => {
  useEffect(() => {
    const recordError = (reason: unknown, source = "") => {
      console.warn("Wallet/extension issue was intercepted.", { message: normalizeRuntimeMessage(reason), source });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isWalletExtensionFailure(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      recordError(event.reason, "unhandledrejection");
      console.warn("Wallet/extension rejection was intercepted.", event.reason);
      showWalletExtensionToast(event.reason);
    };

    const onWindowError = (event: ErrorEvent) => {
      const source = event.filename || "";
      if (!isWalletExtensionFailure(event.error || event.message, source)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      recordError(event.error || event.message, source);
      console.warn("Wallet/extension runtime error was caught.", event.error || event.message);
      showWalletExtensionToast(event.error || event.message);
    };

    const onShieldedWalletError = (event: Event) => {
      const detail =
        "detail" in event && typeof event.detail === "object" && event.detail
          ? (event.detail as { message?: unknown; source?: unknown })
          : {};
      const message = typeof detail.message === "string" ? detail.message : "";
      const source = typeof detail.source === "string" ? detail.source : "early-shield";
      recordError(message, source);
      showWalletExtensionToast(message);
    };

    const lastShieldedError =
      "__darkonnetLastWalletExtensionError" in window
        ? (
            window as typeof window & {
              __darkonnetLastWalletExtensionError?: { message?: unknown; source?: unknown };
            }
          ).__darkonnetLastWalletExtensionError
        : undefined;
    if (lastShieldedError?.message) {
      recordError(
        lastShieldedError.message,
        typeof lastShieldedError.source === "string" ? lastShieldedError.source : "early-shield",
      );
      showWalletExtensionToast(lastShieldedError.message);
    }

    window.addEventListener("darkonnet:wallet-extension-error", onShieldedWalletError);
    window.addEventListener("unhandledrejection", onUnhandledRejection, true);
    window.addEventListener("error", onWindowError, true);
    return () => {
      window.removeEventListener("darkonnet:wallet-extension-error", onShieldedWalletError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection, true);
      window.removeEventListener("error", onWindowError, true);
    };
  }, []);

  return null;
};

const WalletConnectionPersistence = () => {
  const { address, connector, status } = useAccount();
  const { reconnect, isPending } = useReconnect();

  useEffect(() => {
    if (status !== "connected") return;

    rememberPersistentWalletConnection({
      address,
      connectorId: connector?.id,
    });
  }, [address, connector?.id, status]);

  useEffect(() => {
    if (status !== "disconnected" || isPending || !shouldPersistWalletConnection()) return;

    let attempts = 0;

    const tryReconnect = () => {
      if (!shouldPersistWalletConnection()) return;
      attempts += 1;
      reconnect();

      if (attempts >= 12) {
        window.clearInterval(intervalId);
      }
    };

    const timeoutId = window.setTimeout(tryReconnect, 300);
    const intervalId = window.setInterval(tryReconnect, 2500);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [isPending, reconnect, status]);

  return null;
};

export const DappWrapperWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : darkTheme()}
        >
          <WalletConnectionPersistence />
          <WalletErrorShield />
          <ProviderErrorBoundary>
            <ZamaRuntimeProvider>
              <ProgressBar height="3px" color="#2299dd" />
              <div className={`flex flex-col min-h-screen`}>
                <Header />
                <main className="relative flex flex-col flex-1">{children}</main>
              </div>
              <Toaster />
            </ZamaRuntimeProvider>
          </ProviderErrorBoundary>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
