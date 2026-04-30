"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldAlert, XCircle } from "lucide-react";
import { type LocalMarket, getLocalMarkets, updateLocalMarketStatus } from "~~/lib/localMarkets";
import { formatMarketVolume } from "~~/lib/mockMarkets";

const demoPassphrase = ["zama", "private", "markets", "2026"].join("-");

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminMarketRequestsPage() {
  const [passphrase, setPassphrase] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<LocalMarket[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pendingRequests = useMemo(() => requests.filter(request => request.status === "pending"), [requests]);
  const reviewedRequests = useMemo(
    () => requests.filter(request => request.status === "open" || request.status === "declined"),
    [requests],
  );

  const syncRequests = () => setRequests(getLocalMarkets().filter(request => request.status !== "draft"));

  useEffect(() => {
    if (!isUnlocked) return;

    syncRequests();
    window.addEventListener("local-markets-updated", syncRequests);
    window.addEventListener("storage", syncRequests);

    return () => {
      window.removeEventListener("local-markets-updated", syncRequests);
      window.removeEventListener("storage", syncRequests);
    };
  }, [isUnlocked]);

  const unlock = () => {
    if (passphrase.trim() !== demoPassphrase) {
      setError("Wrong admin passphrase.");
      return;
    }

    setError("");
    setIsUnlocked(true);
  };

  const reviewRequest = (requestId: string, status: "open" | "declined") => {
    updateLocalMarketStatus(requestId, status, notes[requestId] ?? "");
    syncRequests();
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
          Accepted creator markets appear under Creator Markets and collect a 1% demo trading fee for the creator
          wallet.
        </div>

        <div className="grid gap-3">
          <div className="hidden grid-cols-[5rem_minmax(0,1fr)_9rem_8rem_17rem] gap-3 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#525252] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#A1A1A1] lg:grid">
            <span>Cover</span>
            <span>Request</span>
            <span>Created</span>
            <span>Stake</span>
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
                  {request.rules}
                </p>
              </div>

              <div className="text-xs text-[#525252] dark:text-[#A1A1A1] lg:text-sm">
                {formatDate(request.createdAt)}
              </div>

              <div className="font-mono text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                {request.creatorStake} cUSD
              </div>

              <div className="grid gap-2">
                <textarea
                  value={notes[request.id] ?? ""}
                  onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))}
                  placeholder="Admin note..."
                  className="min-h-16 resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => reviewRequest(request.id, "open")}
                    className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md bg-[#16A34A] text-xs font-semibold text-white"
                  >
                    <CheckCircle2 size={14} />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewRequest(request.id, "declined")}
                    className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-[#DC2626]/60 text-xs font-semibold text-[#DC2626] dark:text-[#EF4444]"
                  >
                    <XCircle size={14} />
                    Decline
                  </button>
                  <Link
                    href={`/markets/${request.id}?from=admin`}
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
                  className="flex flex-col gap-2 rounded-md border border-[#E5E5E5] bg-white p-3 text-sm dark:border-[#1F1F1F] dark:bg-[#141414] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">{request.question}</span>
                  <span
                    className={
                      request.status === "open"
                        ? "font-semibold text-[#16A34A] dark:text-[#22C55E]"
                        : "font-semibold text-[#DC2626] dark:text-[#EF4444]"
                    }
                  >
                    {request.status === "open" ? "Accepted" : "Declined"}
                  </span>
                  <span className="font-mono text-[#525252] dark:text-[#A1A1A1]">
                    Vol {formatMarketVolume(request)} / Yes {Math.round(request.yesProbability * 100)}%
                  </span>
                  {request.adminNote && (
                    <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">Note: {request.adminNote}</span>
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
