"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CheckCircle2, LockKeyhole, RotateCcw, ShieldAlert, XCircle, Search } from "lucide-react";
import { isAddress } from "viem";
import { useAccount, useChainId, useReadContracts, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { darkonnetApi } from "~~/lib/darkonnetApi";
import type { Market } from "~~/lib/mockMarkets";
import { formatMarketVolume } from "~~/lib/mockMarkets";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

const demoPassphrase = process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE || "local-dev-admin";
const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type MarketInfo = readonly [bigint, string, string, bigint, boolean, number, boolean, boolean];

const marketExpirySeconds = (market: Pick<Market, "endsAt">) => {
  const seconds = Math.floor(new Date(market.endsAt).getTime() / 1000);
  if (!Number.isFinite(seconds) || seconds <= Math.floor(Date.now() / 1000)) {
    throw new Error("Market expiry must be a future date before it can be approved on-chain.");
  }
  return BigInt(seconds);
};

const outcomeLabel = (winner: number, canceled: boolean) => {
  if (canceled) return "Canceled";
  return winner === 0 ? "Resolved Yes" : "Resolved No";
};

export default function AdminMarketRequestsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const [passphrase, setPassphrase] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<Market[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const pendingRequests = useMemo(() => requests.filter(request => request.status === "pending" && (request.question.toLowerCase().includes(searchQuery.toLowerCase()) || request.id.toLowerCase().includes(searchQuery.toLowerCase()))), [requests, searchQuery]);
  const reviewedRequests = useMemo(
    () => requests.filter(request => (request.status === "open" || request.status === "declined") && (request.question.toLowerCase().includes(searchQuery.toLowerCase()) || request.id.toLowerCase().includes(searchQuery.toLowerCase()))),
    [requests, searchQuery],
  );

  const settlementTargets = useMemo(
    () => reviewedRequests.filter(request => request.status === "open" && request.onchainMarketId),
    [reviewedRequests],
  );

  const settlementReads = useReadContracts({
    allowFailure: true,
    contracts: settlementTargets.map(request => ({
      address: marketContract?.address,
      abi: marketContract?.abi,
      functionName: "getMarketInfo",
      args: [BigInt(request.onchainMarketId!)],
      chainId: sepolia.id,
    })),
    query: {
      enabled: Boolean(isUnlocked && marketContract && settlementTargets.length > 0),
      refetchOnWindowFocus: false,
    },
  });

  const settlementByMarketId = useMemo(() => {
    const entries = new Map<string, MarketInfo>();
    settlementTargets.forEach((request, index) => {
      const result = settlementReads.data?.[index];
      if (result?.status === "success" && Array.isArray(result.result)) {
        entries.set(request.id, result.result as unknown as MarketInfo);
      }
    });
    return entries;
  }, [settlementReads.data, settlementTargets]);

  const syncRequests = async () => {
    try {
      setError("");
      setRequests((await darkonnetApi.listMarkets()).filter(request => request.status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load market requests from the backend.");
    }
  };

  useEffect(() => {
    if (!isUnlocked) return;

    syncRequests();
    const interval = window.setInterval(syncRequests, 15_000);
    return () => window.clearInterval(interval);
  }, [isUnlocked]);

  const unlock = () => {
    if (passphrase.trim() !== demoPassphrase) {
      setError("Wrong admin passphrase.");
      return;
    }

    setError("");
    setIsUnlocked(true);
  };

  const requireSepolia = (action: string) => {
    if (chainId !== sepolia.id) {
      throw new Error(`Switch your wallet to Sepolia before ${action}.`);
    }
  };

  const reviewRequest = async (requestId: string, status: "open" | "declined") => {
    try {
      setError("");
      setReviewingId(requestId);
      const request = requests.find(item => item.id === requestId);
      if (!request) {
        throw new Error("Market request was not found.");
      }

      if (status === "open") {
        if (!marketContract) {
          throw new Error("DarkONNET prediction market contract is not configured for Sepolia.");
        }

        if (!isConnected) {
          openConnectModal?.();
          throw new Error("Connect the contract-owner wallet to approve markets on-chain.");
        }

        if (!request.onchainMarketId) {
          throw new Error("This market is missing its on-chain numeric ID.");
        }

        requireSepolia("approving markets on-chain");

        const creatorAddress = request.creatorKey && isAddress(request.creatorKey) ? request.creatorKey : null;
        const expiresAt = marketExpirySeconds(request);
        const txHash = creatorAddress
          ? await writeContractAsync({
              address: marketContract.address,
              abi: marketContract.abi,
              functionName: "createMarketWithCreator",
              args: [BigInt(request.onchainMarketId), request.category, request.question, creatorAddress, expiresAt],
              chainId: sepolia.id,
              gas: 3_500_000n,
            })
          : await writeContractAsync({
              address: marketContract.address,
              abi: marketContract.abi,
              functionName: "createMarket",
              args: [BigInt(request.onchainMarketId), request.category, request.question, expiresAt],
              chainId: sepolia.id,
              gas: 3_000_000n,
            });
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: sepolia.id });
      }

      if (status === "declined" && request.creatorKey && request.onchainMarketId && marketContract) {
        if (!isConnected) {
          openConnectModal?.();
          throw new Error("Connect the contract-owner wallet to return the creator stake.");
        }
        requireSepolia("returning the creator stake");
        const withdrawHash = await writeContractAsync({
          address: marketContract.address,
          abi: marketContract.abi,
          functionName: "withdrawCreatorStake",
          args: [BigInt(request.onchainMarketId)],
          chainId: sepolia.id,
          gas: 3_000_000n,
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: withdrawHash, chainId: sepolia.id });
      }

      await darkonnetApi.updateMarketStatus(requestId, status, notes[requestId] ?? "", address);
      await syncRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this market request.");
    } finally {
      setReviewingId(null);
    }
  };

  const resolveMarket = async (requestId: string, resolution: "yes" | "no" | "canceled") => {
    try {
      setError("");
      setResolvingId(requestId);
      const request = requests.find(item => item.id === requestId);
      if (!request) {
        throw new Error("Market request was not found.");
      }
      if (!marketContract) {
        throw new Error("DarkONNET prediction market contract is not configured for Sepolia.");
      }
      if (!isConnected) {
        openConnectModal?.();
        throw new Error("Connect the contract-owner wallet to resolve markets on-chain.");
      }
      if (!request.onchainMarketId) {
        throw new Error("This market is missing its on-chain numeric ID.");
      }
      requireSepolia("resolving markets on-chain");

      const txHash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "settle",
        args: [BigInt(request.onchainMarketId), resolution === "no" ? 1 : 0, resolution === "canceled"],
        chainId: sepolia.id,
        gas: 3_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: sepolia.id });
      if (request.creatorKey && isAddress(request.creatorKey)) {
        const releaseHash = await writeContractAsync({
          address: marketContract.address,
          abi: marketContract.abi,
          functionName: "releaseCreatorStake",
          args: [BigInt(request.onchainMarketId)],
          chainId: sepolia.id,
          gas: 3_000_000n,
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: releaseHash, chainId: sepolia.id });
      }
      await darkonnetApi.resolveMarket(requestId, resolution, notes[requestId] ?? "", address);
      await syncRequests();
      await settlementReads.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resolve this market.");
    } finally {
      setResolvingId(null);
    }
  };

  if (!isUnlocked) {
    return (
      <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-5 dark:border-[#1F1F1F] dark:bg-[#141414]">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD60A] text-[#0A0A0A]">
            <LockKeyhole size={20} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Admin Review</h1>
          <p className="mt-2 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
            Prototype-only gate for reviewing local market creation requests.
          </p>
          <label className="mt-5 block">
            <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Passphrase</span>
            <input
              type="password"
              value={passphrase}
              onChange={event => {
                setError("");
                setPassphrase(event.target.value);
              }}
              onKeyDown={event => {
                if (event.key === "Enter") unlock();
              }}
              className="mt-2 h-11 w-full rounded-md border border-[#E5E5E5] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
            />
          </label>
          {error && <div className="mt-3 text-sm font-semibold text-[#DC2626]">{error}</div>}
          <button
            type="button"
            onClick={unlock}
            className="smooth-action mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
          >
            <ShieldAlert size={17} />
            Unlock Panel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Market Request Admin</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
              Review creator-submitted markets before they go live. Backend auth should protect this route before
              launch.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md border border-[#E5E5E5] bg-white px-3 py-2 dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="font-mono text-lg font-semibold text-[#FFD60A]">{pendingRequests.length}</div>
              <div className="text-[#525252] dark:text-[#A1A1A1]">Pending</div>
            </div>
            <div className="rounded-md border border-[#E5E5E5] bg-white px-3 py-2 dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="font-mono text-lg font-semibold text-[#16A34A]">
                {requests.filter(request => request.status === "open").length}
              </div>
              <div className="text-[#525252] dark:text-[#A1A1A1]">Accepted</div>
            </div>
            <div className="rounded-md border border-[#E5E5E5] bg-white px-3 py-2 dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="font-mono text-lg font-semibold text-[#DC2626]">
                {requests.filter(request => request.status === "declined").length}
              </div>
              <div className="text-[#525252] dark:text-[#A1A1A1]">Declined</div>
            </div>
          </div>
        </header>

        <div className="mb-4 rounded-md border border-[#FFD60A]/30 bg-[#FFD60A]/10 px-4 py-3 text-sm leading-6 text-[#A37500] dark:text-[#FFD60A]">
          Accepted creator markets are written to the DarkONNET backend and appear under Creator Markets.
        </div>

        <div className="mb-4 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525252] dark:text-[#A1A1A1]" />
          <input
            type="text"
            placeholder="Search markets by question or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-md border border-[#E5E5E5] bg-white pl-10 pr-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#FAFAFA]"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-[#DC2626]/30 px-4 py-3 text-sm font-semibold text-[#DC2626]">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          <div className="hidden grid-cols-[5rem_minmax(0,1fr)_9rem_8rem_17rem] gap-3 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#525252] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#A1A1A1] lg:grid">
            <span>Cover</span>
            <span>Request</span>
            <span>Resolution</span>
            <span>Token</span>
            <span>Review</span>
          </div>

          {pendingRequests.length === 0 && (
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 text-sm text-[#525252] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#A1A1A1]">
              No pending requests right now.
            </div>
          )}

          {pendingRequests.map(request => (
            <article
              key={request.id}
              className="grid gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 dark:border-[#1F1F1F] dark:bg-[#141414] lg:grid-cols-[5rem_minmax(0,1fr)_9rem_8rem_17rem] lg:items-center"
            >
              <div className="h-24 overflow-hidden rounded-md border border-[#E5E5E5] bg-[#F8FAFC] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] lg:h-16">
                {request.coverImageDataUrl ? (
                  <div
                    aria-hidden="true"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${request.coverImageDataUrl})` }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#525252] dark:text-[#A1A1A1]">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md border border-[#FFD60A]/40 px-2 py-1 font-semibold text-[#A37500] dark:text-[#FFD60A]">
                    {request.category}
                  </span>
                  <span className="rounded-md border border-[#16A34A]/30 px-2 py-1 font-semibold text-[#16A34A] dark:text-[#22C55E]">
                    1% creator fee
                  </span>
                </div>
                <h2 className="mt-2 truncate text-base font-semibold leading-snug text-[#0A0A0A] dark:text-[#FAFAFA]">
                  {request.question}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#525252] dark:text-[#A1A1A1]">
                  {request.rules || "No rules supplied."}
                </p>
              </div>

              <div className="text-xs text-[#525252] dark:text-[#A1A1A1] lg:text-sm">{formatDate(request.endsAt)}</div>

              <div className="font-mono text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">cUSDT market</div>

              <div className="grid gap-2">
                <textarea
                  value={notes[request.id] ?? ""}
                  onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))}
                  placeholder="Admin note..."
                  className="min-h-16 resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => reviewRequest(request.id, "open")}
                    disabled={reviewingId === request.id}
                    className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md bg-[#16A34A] text-xs font-semibold text-white"
                  >
                    <CheckCircle2 size={14} />
                    {reviewingId === request.id ? "Writing" : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewRequest(request.id, "declined")}
                    disabled={reviewingId === request.id}
                    className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-[#DC2626]/60 text-xs font-semibold text-[#DC2626] dark:text-[#EF4444]"
                  >
                    <XCircle size={14} />
                    Decline
                  </button>
                  <Link
                    href={`/markets/${request.slug || request.id}?from=admin`}
                    className="smooth-action flex h-9 items-center justify-center rounded-md border border-[#E5E5E5] text-xs font-semibold text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {reviewedRequests.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Reviewed</h2>
            <div className="mt-3 grid gap-2">
              {reviewedRequests.map(request => (
                <div
                  key={request.id}
                  className="grid gap-3 rounded-md border border-[#E5E5E5] bg-white p-3 text-sm dark:border-[#1F1F1F] dark:bg-[#141414] lg:grid-cols-[minmax(0,1fr)_7rem_11rem_18rem]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                      {request.question}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-[#525252] dark:text-[#A1A1A1]">
                      Vol {formatMarketVolume(request)} / Yes {Math.round(request.yesProbability * 100)}%
                    </span>
                    {request.adminNote && (
                      <span className="mt-1 block text-xs text-[#525252] dark:text-[#A1A1A1]">
                        Note: {request.adminNote}
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      request.status === "open"
                        ? "font-semibold text-[#16A34A] dark:text-[#22C55E]"
                        : "font-semibold text-[#DC2626] dark:text-[#EF4444]"
                    }
                  >
                    {request.status === "open" ? "Accepted" : "Declined"}
                  </span>
                  <span className="font-semibold text-[#525252] dark:text-[#A1A1A1]">
                    {request.status !== "open"
                      ? "-"
                      : settlementByMarketId.get(request.id)?.[4]
                        ? outcomeLabel(
                            Number(settlementByMarketId.get(request.id)?.[5] ?? 0),
                            Boolean(settlementByMarketId.get(request.id)?.[6]),
                          )
                        : request.resolution
                          ? outcomeLabel(request.resolution === "no" ? 1 : 0, request.resolution === "canceled")
                          : "Unresolved"}
                  </span>
                  {request.status === "open" && !settlementByMarketId.get(request.id)?.[4] ? (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => resolveMarket(request.id, "yes")}
                        disabled={resolvingId === request.id}
                        className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md bg-[#16A34A] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={14} />
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveMarket(request.id, "no")}
                        disabled={resolvingId === request.id}
                        className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-[#DC2626]/60 text-xs font-semibold text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#EF4444]"
                      >
                        <XCircle size={14} />
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveMarket(request.id, "canceled")}
                        disabled={resolvingId === request.id}
                        className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-[#E5E5E5] text-xs font-semibold text-[#525252] disabled:cursor-not-allowed disabled:opacity-60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                      >
                        <RotateCcw size={14} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">
                      {request.status === "open" ? "Resolution locked on-chain" : "No on-chain resolution"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
