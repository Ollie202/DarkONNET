"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEncrypt } from "@zama-fhe/react-sdk";
import { ArrowLeft, CalendarClock, ChevronDown, Lock, MessageCircle, ShieldCheck, ThumbsUp } from "lucide-react";
import { bytesToHex, parseUnits } from "viem";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { fallbackImages, marketImages } from "~~/components/markets/MarketCard";
import { MatchupVisual } from "~~/components/markets/MatchupVisual";
import { SentimentBar, useLiveProbability } from "~~/components/markets/SentimentBar";
import { useNotifications } from "~~/components/notifications/NotificationsContext";
import { useProfile } from "~~/components/profile/ProfileContext";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { EncryptedERC20 } from "~~/contracts/EncryptedERC20";
import { useOnchainOddsSnapshot } from "~~/hooks/markets/useOnchainOddsSnapshot";
import { useTimeRemaining } from "~~/hooks/markets/useTimeRemaining";
import { useCUSDTBalance } from "~~/hooks/token/useCUSDTBalance";
import { type ApiComment, darkonnetApi } from "~~/lib/darkonnetApi";
import { type Market, formatMarketVolume, isMarketEnded } from "~~/lib/mockMarkets";
import {
  PLATFORM_TOKEN_LABEL,
  PLATFORM_TOKEN_SYMBOL,
  formatPlatformToken,
  formatPlatformTokenUnits,
} from "~~/lib/token";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";
import { createClient } from "~~/utils/supabase/client";

type SelectedSide = "yes" | "no" | null;
type CommentSort = "top" | "new";

type MarketComment = {
  id: string;
  author: string;
  walletAddress: string;
  createdAt: number;
  time: string;
  text: string;
  likes: number;
  liked: boolean;
  replyTo?: string;
  parentId?: string;
};

type MarketDetailProps = {
  market: Market;
};

type MarketInfo = readonly [bigint, string, string, bigint, boolean, number, boolean, boolean];

const presetAmounts = [1, 5, 10, 20, 50];
const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);
const cUSDTContract = deploymentFor(EncryptedERC20, sepolia.id);

const marketDescriptions: Partial<Record<string, string>> = {
  "oil-100-june":
    "This market resolves Yes if a widely cited Brent crude benchmark trades above $100 before July 1, 2026. It is intended to track energy supply stress, geopolitical risk, and commodity market pressure.",
  "middle-east-supply":
    "This market tracks whether reported shipping disruptions connected to Middle East routes meaningfully ease before August 2026.",
  "global-growth-31":
    "This market resolves around whether the IMF keeps 2026 global growth at or above 3.1% in its next major published outlook update.",
  "fed-cut-summer":
    "This market resolves Yes if the Federal Reserve cuts its target rate before the end of summer 2026.",
  "ai-stocks-correction":
    "This market tracks whether a basket of major AI-linked equities experiences a broad 10% correction before Q4 2026.",
};

const getMarketDescription = (market: Market) =>
  market.description ||
  marketDescriptions[market.slug || market.id] ||
  `This market resolves according to credible public reporting and the stated resolution date. The outcome should be judged from reliable sources relevant to ${market.signalLabel.toLowerCase()}.`;

const formatCategory = (category: Market["category"]) => category[0].toUpperCase() + category.slice(1);

const getResolutionLabel = (marketInfo?: MarketInfo, fallbackResolution?: Market["resolution"]) => {
  if (marketInfo?.[4]) {
    if (marketInfo[5]) return "Canceled";
    return marketInfo[5] === 0 ? "Resolved Yes" : "Resolved No";
  }

  if (fallbackResolution === "canceled") return "Canceled";
  if (fallbackResolution === "yes") return "Resolved Yes";
  if (fallbackResolution === "no") return "Resolved No";
  return null;
};

const relativeTime = (createdAt: string | number) => {
  const time = typeof createdAt === "number" ? createdAt : new Date(createdAt).getTime();
  const diffMs = Date.now() - time;
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const flattenComments = (
  comments: ApiComment[],
  activeWalletAddress = "",
  parentAuthor?: string,
  parentId?: string,
): MarketComment[] =>
  comments.flatMap(comment => {
    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy.map(wallet => wallet.toLowerCase()) : [];
    const mapped: MarketComment = {
      id: comment.id,
      author: comment.displayName,
      walletAddress: comment.walletAddress,
      createdAt: new Date(comment.createdAt).getTime(),
      time: relativeTime(comment.createdAt),
      text: comment.body,
      likes: likedBy.length,
      liked: Boolean(activeWalletAddress && likedBy.includes(activeWalletAddress.toLowerCase())),
      replyTo: parentAuthor,
      parentId: parentId || undefined,
    };

    return [
      mapped,
      ...flattenComments(comment.replies || [], activeWalletAddress, comment.displayName, parentId || comment.id),
    ];
  });

export const MarketDetail = ({ market }: MarketDetailProps) => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const encrypt = useEncrypt();
  const { writeContractAsync } = useWriteContract();
  const cUSDTBalance = useCUSDTBalance();
  const { openConnectModal } = useConnectModal();
  const { addNotification } = useNotifications();
  const { profileImageDataUrl, profileName, walletAddress } = useProfile();
  const activeCommentWalletAddress = (address || walletAddress || "").toLowerCase();
  const searchParams = useSearchParams();
  const metadataProbability = useLiveProbability(market.yesProbability, market.sentimentSignals);
  const initialSide = searchParams.get("side");
  const [selectedSide, setSelectedSide] = useState<SelectedSide>(
    initialSide === "yes" || initialSide === "no" ? initialSide : null,
  );
  const [amount, setAmount] = useState("");
  const [betMessage, setBetMessage] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSort, setCommentSort] = useState<CommentSort>("top");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [commentsMessage, setCommentsMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const onchainMarketId = useMemo(() => {
    if (!market.onchainMarketId) {
      return undefined;
    }

    try {
      return BigInt(market.onchainMarketId);
    } catch {
      return undefined;
    }
  }, [market.onchainMarketId]);
  const oddsSnapshot = useOnchainOddsSnapshot({
    marketId: market.onchainMarketId,
    enabled: Boolean(market.onchainMarketId),
  });
  const probability = oddsSnapshot.probability ?? metadataProbability;
  const volumeLabel = oddsSnapshot.poolSnapshot
    ? formatPlatformTokenUnits(oddsSnapshot.poolSnapshot.yes + oddsSnapshot.poolSnapshot.no)
    : formatMarketVolume(market);
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const timeLeft = useTimeRemaining(market.endsAt);
  const marketInfoRead = useReadContract({
    address: marketContract?.address,
    abi: marketContract?.abi,
    functionName: "getMarketInfo",
    args: onchainMarketId === undefined ? undefined : [onchainMarketId],
    chainId: sepolia.id,
    query: {
      enabled: Boolean(marketContract && onchainMarketId !== undefined),
      refetchOnWindowFocus: false,
    },
  });
  const marketInfo = marketInfoRead.data as MarketInfo | undefined;
  const isOnchainSettled = Boolean(marketInfo?.[4]);
  const isOnchainMarketReady = Boolean(marketInfo?.[7]);
  const isCheckingOnchainMarket = marketInfoRead.isLoading || marketInfoRead.isFetching;
  const isResolvedByMetadata = Boolean(market.resolution);
  const isEnded = isMarketEnded(market.endsAt);
  const resolutionLabel = getResolutionLabel(marketInfo, market.resolution);
  const imageUrl =
    market.coverImageDataUrl ?? marketImages[market.slug || market.id] ?? fallbackImages[market.category];
  const parsedAmount = Number(amount);
  const cUSDTAmount = parsedAmount || 0;
  const hasCreatorFee = Boolean(market.creatorKey);
  const creatorFee = hasCreatorFee ? cUSDTAmount * 0.01 : 0;
  const netCUSDTAmount = Math.max(0, cUSDTAmount - creatorFee);
  const cUSDTBalanceNumber = cUSDTBalance.balance === undefined ? null : Number(cUSDTBalance.balance) / 1_000_000;
  const hasInsufficientBalance = cUSDTBalanceNumber !== null && cUSDTAmount > cUSDTBalanceNumber;
  const currentProfileName = profileName || "Username Required";
  const isMarketTradable =
    (!market.status || market.status === "open") &&
    (isOnchainMarketReady || isCheckingOnchainMarket) &&
    !isOnchainSettled &&
    !isResolvedByMetadata &&
    !isEnded;
  const marketClosedHeadline = resolutionLabel
    ? "This market has resolved."
    : isEnded
      ? "This market has ended."
      : isCheckingOnchainMarket
        ? "Synchronizing with blockchain..."
        : !isOnchainMarketReady
          ? "This market is not live on-chain yet."
          : market.status === "declined"
            ? "This market was declined."
            : market.status === "pending"
              ? "This market is waiting for admin review."
              : "Betting is closed for this market.";
  const marketClosedBody = resolutionLabel
    ? `Betting is closed because this market is ${resolutionLabel.toLowerCase()}.`
    : isEnded
      ? "This market has ended, so encrypted betting is closed."
      : isCheckingOnchainMarket
        ? "Authenticating market availability on the Zama fhEVM..."
        : !isOnchainMarketReady
          ? "This market exists in backend metadata, but it has not been created on the current prediction contract yet."
          : market.status === "declined"
            ? "This market request was declined, so betting is disabled."
            : market.status === "pending"
              ? "This market request is pending approval. Betting unlocks after an admin accepts it."
              : "Encrypted betting is currently unavailable for this market.";
  const oddsSourceLabel = oddsSnapshot.probability === null ? "Metadata odds" : "On-chain pool odds";
  const cameFromAdmin = searchParams.get("from") === "admin";
  const backHref = cameFromAdmin ? "/admin-market-requests" : "/";
  const backLabel = cameFromAdmin ? "Back To Pending Requests" : "Back To Markets";

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  useEffect(() => {
    const side = searchParams.get("side");
    setSelectedSide(side === "yes" || side === "no" ? side : null);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const loadComments = async () => {
      try {
        setCommentsMessage("");
        const { data: backendComments, error: fetchError } = await supabase
          .from("comments")
          .select("*")
          .eq("market_id", market.id)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;
        if (active && backendComments) {
          const mapped: MarketComment[] = backendComments.map(c => ({
            id: c.id,
            author: c.display_name,
            walletAddress: c.wallet_address,
            createdAt: new Date(c.created_at).getTime(),
            time: relativeTime(c.created_at),
            text: c.body,
            likes: c.liked_by?.length || 0,
            liked: Boolean(activeCommentWalletAddress && c.liked_by?.includes(activeCommentWalletAddress)),
            parentId: c.parent_id,
          }));
          setComments(mapped);
        }
      } catch (err) {
        if (active) setCommentsMessage(err instanceof Error ? err.message : "Unable to load backend comments.");
      }
    };

    loadComments();

    const channel = supabase
      .channel(`market-detail:${market.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `market_id=eq.${market.id}` },
        () => {
          loadComments();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets", filter: `market_id=eq.${market.id}` },
        (payload: { new: Record<string, unknown> }) => {
          // Handle market status/metadata updates if needed
          console.log("Market updated:", payload.new);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [activeCommentWalletAddress, market.id]);

  const estimatedShares = useMemo(() => {
    if (!netCUSDTAmount || !selectedSide || hasInsufficientBalance) return "0.00";
    const price = selectedSide === "yes" ? probability : 1 - probability;
    return (netCUSDTAmount / Math.max(price, 0.01)).toFixed(2);
  }, [hasInsufficientBalance, netCUSDTAmount, probability, selectedSide]);

  const formatCUSDT = formatPlatformToken;
  const formatUsdEquivalent = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 4 })}`;

  const topLevelComments = useMemo(() => {
    return comments.filter(comment => !comment.parentId);
  }, [comments]);

  const repliesByParent = useMemo(() => {
    return comments.reduce<Record<string, MarketComment[]>>((groups, comment) => {
      if (!comment.parentId) return groups;
      return {
        ...groups,
        [comment.parentId]: [...(groups[comment.parentId] ?? []), comment].sort((a, b) => a.createdAt - b.createdAt),
      };
    }, {});
  }, [comments]);

  const sortedComments = useMemo(() => {
    return [...topLevelComments].sort((a, b) => {
      if (commentSort === "new") return b.createdAt - a.createdAt;
      return b.likes - a.likes || b.createdAt - a.createdAt;
    });
  }, [commentSort, topLevelComments]);

  const addComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    const commentWalletAddress = address || walletAddress;
    if (!commentWalletAddress) {
      setCommentsMessage("Connect wallet to comment.");
      openConnectModal?.();
      return;
    }

    const supabase = createClient();
    try {
      const { error: postError } = await supabase.from("comments").insert({
        market_id: market.id,
        wallet_address: commentWalletAddress.toLowerCase(),
        display_name: currentProfileName,
        body: text,
      });

      if (postError) throw postError;

      setCommentDraft("");
      setCommentSort("new");
      setCommentsMessage("");
    } catch (err) {
      setCommentsMessage(err instanceof Error ? err.message : "Unable to post comment.");
    }
  };

  const addReply = async (targetId: string) => {
    const text = replyDrafts[targetId]?.trim();
    if (!text) return;
    const commentWalletAddress = address || walletAddress;
    if (!commentWalletAddress) {
      setCommentsMessage("Connect wallet to reply.");
      openConnectModal?.();
      return;
    }

    const parentComment = comments.find(comment => comment.id === targetId);
    const parentAuthor = parentComment?.author ?? "someone";
    const parentId = parentComment?.parentId ?? targetId;
    const replyAuthor = currentProfileName;

    const supabase = createClient();
    try {
      const { error: postError } = await supabase.from("comments").insert({
        market_id: market.id,
        wallet_address: commentWalletAddress.toLowerCase(),
        display_name: replyAuthor,
        body: text,
        parent_id: parentId,
      });

      if (postError) throw postError;

      if (parentAuthor === currentProfileName) {
        addNotification({
          title: "Reply On Your Comment",
          message: `${replyAuthor} replied to your comment on "${market.question}"`,
          time: "Just now",
        });
      }

      setReplyDrafts(prev => ({ ...prev, [targetId]: "" }));
      setReplyingTo(null);
      setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
      setCommentsMessage("");
    } catch (err) {
      setCommentsMessage(err instanceof Error ? err.message : "Unable to post reply.");
    }
  };

  const toggleLike = async (commentId: string) => {
    const comment = comments.find(item => item.id === commentId);
    if (!comment) return;
    if (!activeCommentWalletAddress) {
      setCommentsMessage("Connect wallet to like comments.");
      openConnectModal?.();
      return;
    }

    const nextLiked = !comment.liked;
    const supabase = createClient();

    try {
      const { data: currentComment } = await supabase.from("comments").select("liked_by").eq("id", commentId).single();

      let likedBy = currentComment?.liked_by || [];
      if (nextLiked) {
        if (!likedBy.includes(activeCommentWalletAddress)) {
          likedBy.push(activeCommentWalletAddress);
        }
      } else {
        likedBy = likedBy.filter((w: string) => w !== activeCommentWalletAddress);
      }

      const { error: updateError } = await supabase.from("comments").update({ liked_by: likedBy }).eq("id", commentId);

      if (updateError) throw updateError;
      setCommentsMessage("");
    } catch (err) {
      setCommentsMessage(err instanceof Error ? err.message : "Unable to update comment like.");
    }
  };

  const addPresetAmount = (preset: number) => {
    setAmount(currentAmount => {
      const nextAmount = (Number(currentAmount) || 0) + preset;
      return Number.isInteger(nextAmount) ? String(nextAmount) : nextAmount.toFixed(4);
    });
  };

  const reviewBet = async () => {
    if (!isMarketTradable || !selectedSide || !amount || hasInsufficientBalance || isPlacingBet) return;
    if (!isConnected) {
      setBetMessage("Connect your wallet to place an encrypted prediction.");
      openConnectModal?.();
      return;
    }
    const participantWalletAddress = address || walletAddress;
    if (!participantWalletAddress) {
      setBetMessage("Wallet address is still loading. Try again in a moment.");
      return;
    }
    if (!market.onchainMarketId) {
      setBetMessage("This market is missing its on-chain numeric ID. Re-save or approve it through the backend first.");
      return;
    }
    if (!marketContract || !cUSDTContract) {
      setBetMessage("DarkONNET market contracts are not configured for Sepolia.");
      return;
    }
    if (!isOnchainMarketReady) {
      setBetMessage("This market is not live on the current prediction contract yet. Try again after it syncs.");
      return;
    }
    if (chainId !== sepolia.id) {
      setBetMessage("Switch your wallet to Sepolia to place a bet.");
      return;
    }

    const amountUnits = parseUnits(amount, 6);
    if (amountUnits <= 0n || amountUnits > 18_446_744_073_709_551_615n) {
      setBetMessage("Enter a positive cUSDT amount that fits the encrypted token limit.");
      return;
    }

    setIsPlacingBet(true);
    try {
      setBetMessage("Encrypting cUSDT approval...");
      const approvalInput = await encrypt.mutateAsync({
        values: [{ value: amountUnits, type: "euint64" }],
        contractAddress: cUSDTContract.address,
        userAddress: participantWalletAddress as `0x${string}`,
      });

      setBetMessage("Approving encrypted cUSDT spend...");
      await writeContractAsync({
        address: cUSDTContract.address,
        abi: cUSDTContract.abi,
        functionName: "approve",
        args: [
          marketContract.address,
          bytesToHex(approvalInput.handles[0]!) as `0x${string}`,
          bytesToHex(approvalInput.inputProof) as `0x${string}`,
        ],
        chainId: sepolia.id,
        gas: 15_000_000n,
      });

      setBetMessage("Approval sent. Encrypting prediction amount...");
      const betInput = await encrypt.mutateAsync({
        values: [{ value: amountUnits, type: "euint64" }],
        contractAddress: marketContract.address,
        userAddress: participantWalletAddress as `0x${string}`,
      });

      setBetMessage("Sending encrypted prediction after approval...");
      const betHash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "bet",
        args: [
          BigInt(market.onchainMarketId),
          selectedSide === "yes" ? 0 : 1,
          bytesToHex(betInput.handles[0]!) as `0x${string}`,
          bytesToHex(betInput.inputProof) as `0x${string}`,
        ],
        chainId: sepolia.id,
        gas: 15_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: betHash, chainId: sepolia.id });

      await darkonnetApi.addParticipant(market.id, participantWalletAddress);
      setBetMessage("Bet placed");
      void oddsSnapshot.loadLatestSnapshot();
      setAmount("");
    } catch (err) {
      setBetMessage(err instanceof Error ? err.message : "Unable to place encrypted prediction.");
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <section className="px-4 py-5 sm:px-6 sm:py-6 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 lg:overflow-y-auto lg:pr-2">
          <Link
            href={backHref}
            onClick={handleBack}
            className="smooth-action mb-4 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-[#525252] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>

          <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="relative overflow-hidden">
              <MatchupVisual fallbackImageUrl={imageUrl} market={market} variant="hero" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                    {formatCategory(market.category)}
                  </span>
                  {market.trending && (
                    <span className="rounded-md border border-[#FFD60A]/40 bg-[#FFD60A]/15 px-2 py-1 text-xs font-semibold text-[#FFD60A] backdrop-blur">
                      Trending
                    </span>
                  )}
                  {(market.status || hasCreatorFee) && (
                    <span className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                      {market.status === "pending"
                        ? "Pending Admin Review"
                        : hasCreatorFee
                          ? "Creator Market"
                          : market.status === "declined"
                            ? "Declined"
                            : market.status === "resolved"
                              ? "Resolved"
                              : "Open"}
                    </span>
                  )}
                  {resolutionLabel && (
                    <span className="rounded-md border border-[#FFD60A]/50 bg-[#FFD60A]/20 px-2 py-1 text-xs font-semibold text-[#FFD60A] backdrop-blur">
                      {resolutionLabel}
                    </span>
                  )}
                </div>
                <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-white md:text-3xl">
                  {market.question}
                </h1>
              </div>
            </div>

            <div className="space-y-6 p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Current Yes</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#16A34A] dark:text-[#22C55E]">
                    {yesPct}%
                  </div>
                </div>
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Current No</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#DC2626] dark:text-[#EF4444]">
                    {noPct}%
                  </div>
                </div>
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Closes In</div>
                  <div className="mt-1 flex items-center gap-2 text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                    <CalendarClock size={20} />
                    {timeLeft}
                  </div>
                </div>
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="text-xs text-[#525252] dark:text-[#A1A1A1]">Volume</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                    {volumeLabel}
                  </div>
                </div>
              </div>

              <SentimentBar probability={probability} signals={market.sentimentSignals} />

              <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">{oddsSourceLabel}</div>
                    <div className="mt-1 text-xs leading-5 text-[#525252] dark:text-[#A1A1A1]">
                      {oddsSnapshot.poolSnapshot
                        ? "Current Yes and Current No are using decrypted on-chain pool odds."
                        : oddsSnapshot.isLoading
                          ? "Loading latest on-chain pool odds..."
                          : "Using metadata odds until on-chain pool odds are available."}
                    </div>
                    {oddsSnapshot.error && (
                      <div className="mt-1 text-xs font-semibold text-[#DC2626] dark:text-[#EF4444]">
                        {oddsSnapshot.error.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(resolutionLabel ||
                isEnded ||
                market.status === "pending" ||
                market.status === "declined" ||
                hasCreatorFee) && (
                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#525252] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
                  {resolutionLabel ? (
                    <>
                      This market is closed and {resolutionLabel.toLowerCase()}.
                      {market.resolvedAt && (
                        <span className="block font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                          Resolved {new Date(market.resolvedAt).toLocaleString()}
                        </span>
                      )}
                    </>
                  ) : isEnded ? (
                    <>This market has ended, so encrypted betting is closed.</>
                  ) : market.status === "declined" ? (
                    <>
                      This market request was declined.
                      {market.adminNote && (
                        <span className="block font-semibold text-[#DC2626] dark:text-[#EF4444]">
                          Admin note: {market.adminNote}
                        </span>
                      )}
                    </>
                  ) : hasCreatorFee ? (
                    <>
                      Creator markets route <span className="font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">1%</span>{" "}
                      of each trade back to the creator wallet after execution. Odds move with trade flow once the
                      market is approved.
                    </>
                  ) : (
                    <>This creator market request is awaiting admin review before it can accept encrypted trades.</>
                  )}
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Description</h2>
                <p className="mt-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
                  {getMarketDescription(market)}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Resolution Rules</h2>
                <div className="mt-3 space-y-3 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
                  <p>
                    {market.rules ||
                      "Resolves Yes if the condition in the market title is confirmed by reliable public reporting before the resolution date. Otherwise, it resolves No."}
                  </p>
                  <p>
                    Ambiguous reporting, conflicting sources, or incomplete data should be settled by the clearest
                    primary or widely cited public source available at resolution.
                  </p>
                </div>
              </div>

              {market.sources && market.sources.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Sources</h2>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {Array.from(new Set(market.sources)).map(source => (
                      <a
                        key={source}
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className="smooth-action truncate rounded-md border border-[#E5E5E5] bg-[#F8FAFC] px-3 py-2 text-sm text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                      >
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Comments</h2>
                  <div className="flex rounded-md border border-[#E5E5E5] p-0.5 text-xs font-semibold dark:border-[#1F1F1F]">
                    {(["top", "new"] as CommentSort[]).map(sort => (
                      <button
                        key={sort}
                        onClick={() => setCommentSort(sort)}
                        className={`smooth-action h-7 rounded px-3 ${
                          commentSort === sort
                            ? "bg-[#FFD60A] text-[#0A0A0A]"
                            : "text-[#525252] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                        }`}
                        type="button"
                      >
                        {sort === "top" ? "Top" : "New"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-[#E5E5E5] bg-[#F8FAFC] p-3 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
                  <div className="flex gap-3">
                    {profileImageDataUrl ? (
                      <div
                        aria-hidden="true"
                        className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${profileImageDataUrl})` }}
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD60A] text-sm font-bold text-[#0A0A0A]">
                        {currentProfileName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={commentDraft}
                        onChange={event => setCommentDraft(event.target.value)}
                        placeholder="Share your take on this market..."
                        className="min-h-20 w-full resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-3 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#FAFAFA]"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={addComment}
                          disabled={!commentDraft.trim()}
                          className="smooth-action inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-[#FFD60A] px-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
                        >
                          <MessageCircle size={15} />
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {commentsMessage && (
                  <div className="mt-3 rounded-md border border-[#DC2626]/30 px-3 py-2 text-sm font-semibold text-[#DC2626]">
                    {commentsMessage}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {sortedComments.map(comment => {
                    const replies = repliesByParent[comment.id] ?? [];
                    const isExpanded = expandedThreads[comment.id] ?? false;
                    const replyingInsideThread =
                      replyingTo === comment.id || replies.some(reply => reply.id === replyingTo);
                    const replyTarget = replyingInsideThread
                      ? (comments.find(reply => reply.id === replyingTo) ?? comment)
                      : comment;
                    const replyDraft = replyDrafts[replyTarget.id] ?? "";

                    return (
                      <article
                        key={comment.id}
                        className="rounded-lg border border-[#E5E5E5] bg-[#F8FAFC] p-4 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                                {comment.author}
                              </span>
                              <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">{comment.time}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">{comment.text}</p>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                  if (replies.length > 0) {
                                    setExpandedThreads(prev => ({ ...prev, [comment.id]: true }));
                                  }
                                }}
                                className="smooth-action inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#525252] hover:bg-white hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
                              >
                                <MessageCircle size={13} />
                                Reply
                              </button>
                              {replies.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedThreads(prev => ({ ...prev, [comment.id]: !isExpanded }))}
                                  className="smooth-action inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#525252] hover:bg-white hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
                                  aria-expanded={isExpanded}
                                >
                                  <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleLike(comment.id)}
                            aria-pressed={comment.liked}
                            className={`smooth-action inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 text-xs font-semibold ${
                              comment.liked
                                ? "border-[#FFD60A]/70 bg-[#FFD60A]/15 text-[#0A0A0A] dark:text-[#FFD60A]"
                                : "border-[#E5E5E5] text-[#525252] hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                            }`}
                          >
                            <ThumbsUp size={13} className={comment.liked ? "fill-current" : ""} />
                            {comment.likes}
                          </button>
                        </div>

                        {replyingTo === comment.id && (!isExpanded || replies.length === 0) && (
                          <div className="mt-3 flex gap-2 border-l border-[#FFD60A]/50 pl-3">
                            <textarea
                              value={replyDrafts[comment.id] ?? ""}
                              onChange={event =>
                                setReplyDrafts(prev => ({ ...prev, [comment.id]: event.target.value }))
                              }
                              placeholder={`Reply to ${comment.author}...`}
                              className="min-h-16 flex-1 resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#FAFAFA]"
                            />
                            <button
                              type="button"
                              onClick={() => addReply(comment.id)}
                              disabled={!replyDrafts[comment.id]?.trim()}
                              className="smooth-action h-10 cursor-pointer rounded-md bg-[#FFD60A] px-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
                            >
                              Send
                            </button>
                          </div>
                        )}

                        {isExpanded && replies.length > 0 && (
                          <div className="mt-4 ml-3 border-l border-[#E5E5E5] pl-4 dark:border-[#1F1F1F]">
                            {replies.map(reply => (
                              <div
                                key={reply.id}
                                className="border-b border-[#E5E5E5] py-3 first:pt-0 last:border-b-0 dark:border-[#1F1F1F]"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-xs font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                                        {reply.author}
                                      </span>
                                      <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">{reply.time}</span>
                                      <span className="text-xs font-medium text-[#525252] dark:text-[#A1A1A1]">
                                        replying{" "}
                                        <span className="text-[#0A0A0A] dark:text-[#FFD60A]">@{reply.replyTo}</span>
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">
                                      {reply.text}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                                      className="smooth-action mt-3 inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#525252] hover:bg-white hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
                                    >
                                      <MessageCircle size={13} />
                                      Reply
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleLike(reply.id)}
                                    aria-pressed={reply.liked}
                                    className={`smooth-action inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 text-xs font-semibold ${
                                      reply.liked
                                        ? "border-[#FFD60A]/70 bg-[#FFD60A]/15 text-[#0A0A0A] dark:text-[#FFD60A]"
                                        : "border-[#E5E5E5] text-[#525252] hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                                    }`}
                                  >
                                    <ThumbsUp size={13} className={reply.liked ? "fill-current" : ""} />
                                    {reply.likes}
                                  </button>
                                </div>
                              </div>
                            ))}
                            {replyingInsideThread && (
                              <div className="flex gap-2 pt-3">
                                <textarea
                                  value={replyDraft}
                                  onChange={event =>
                                    setReplyDrafts(prev => ({ ...prev, [replyTarget.id]: event.target.value }))
                                  }
                                  placeholder={`Reply to ${replyTarget.author}...`}
                                  className="min-h-16 flex-1 resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                                />
                                <button
                                  type="button"
                                  onClick={() => addReply(replyTarget.id)}
                                  disabled={!replyDraft.trim()}
                                  className="smooth-action h-10 cursor-pointer rounded-md bg-[#FFD60A] px-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:h-full lg:overflow-y-auto lg:pr-1">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-[0_18px_50px_-36px_rgba(10,10,10,0.55)] dark:border-[#1F1F1F] dark:bg-[#141414] lg:sticky lg:top-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Place Bet</h2>
                <p className="mt-1 text-xs text-[#525252] dark:text-[#A1A1A1]">
                  {resolutionLabel
                    ? "This market has resolved. Claim payouts from My Positions."
                    : isMarketTradable
                      ? "No side is selected until you choose one."
                      : marketClosedHeadline}
                </p>
              </div>
              <Lock size={18} className="text-[#FFD60A]" />
            </div>

            {!isMarketTradable && !isCheckingOnchainMarket && (
              <div className="mb-4 rounded-md border border-[#FFD60A]/40 bg-[#FFD60A]/10 p-3 text-sm font-medium text-[#A37500] dark:text-[#FFD60A]">
                {marketClosedBody}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSide("yes")}
                disabled={!isMarketTradable || isCheckingOnchainMarket}
                className={`smooth-action h-11 cursor-pointer rounded-md border px-3 text-sm font-semibold ${
                  selectedSide === "yes"
                    ? "border-[#16A34A] bg-[#16A34A] text-white"
                    : "border-[#16A34A]/30 bg-[#16A34A]/5 text-[#16A34A] hover:bg-[#16A34A]/10 dark:text-[#22C55E]"
                }`}
              >
                Yes {yesPct}%
              </button>
              <button
                type="button"
                onClick={() => setSelectedSide("no")}
                disabled={!isMarketTradable || isCheckingOnchainMarket}
                className={`smooth-action h-11 cursor-pointer rounded-md border px-3 text-sm font-semibold ${
                  selectedSide === "no"
                    ? "border-[#DC2626] bg-[#DC2626] text-white"
                    : "border-[#DC2626]/30 bg-[#DC2626]/5 text-[#DC2626] hover:bg-[#DC2626]/10 dark:text-[#EF4444]"
                }`}
              >
                No {noPct}%
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Token From Wallet</span>
              <div className="mt-2 flex h-11 items-center justify-between rounded-md border border-[#E5E5E5] bg-white px-3 text-sm font-semibold text-[#0A0A0A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]">
                <span>{PLATFORM_TOKEN_LABEL}</span>
                <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">Only currency</span>
              </div>
              <span className="mt-2 flex justify-between text-xs text-[#525252] dark:text-[#A1A1A1]">
                <span>{cUSDTBalance.isReady ? "Encrypted balance" : "Balance"}</span>
                <button
                  type="button"
                  onClick={cUSDTBalance.isReady ? cUSDTBalance.refresh : cUSDTBalance.decryptBalance}
                  disabled={cUSDTBalance.isLoading || cUSDTBalance.isAllowing || cUSDTBalance.isDecrypting}
                  className="font-semibold text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#FAFAFA]"
                >
                  {cUSDTBalance.isLoading
                    ? "Loading"
                    : cUSDTBalance.isAllowing
                      ? "Authorizing"
                      : cUSDTBalance.isDecrypting
                        ? "Decrypting"
                        : cUSDTBalance.balanceLabel
                          ? cUSDTBalance.balanceLabel
                          : cUSDTBalance.hasHandle
                            ? "Decrypt"
                            : "0 cUSDT"}
                </button>
              </span>
            </label>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Amount</span>
                <span className="rounded-md border border-[#E5E5E5] px-2 py-1 text-xs font-semibold text-[#525252] dark:border-[#1F1F1F] dark:text-[#A1A1A1]">
                  {PLATFORM_TOKEN_SYMBOL}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addPresetAmount(preset)}
                    className="smooth-action h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                  >
                    {preset} {PLATFORM_TOKEN_SYMBOL}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => cUSDTBalanceNumber !== null && setAmount(String(cUSDTBalanceNumber))}
                  disabled={cUSDTBalanceNumber === null}
                  className="smooth-action h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] disabled:cursor-not-allowed disabled:opacity-60 hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                >
                  Max
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                placeholder={`Enter ${PLATFORM_TOKEN_SYMBOL} amount`}
                className={`mt-3 h-12 w-full rounded-md border bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:bg-[#0A0A0A] dark:text-[#FAFAFA] ${
                  hasInsufficientBalance ? "border-[#DC2626]" : "border-[#E5E5E5] dark:border-[#1F1F1F]"
                }`}
              />
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-[#525252] dark:text-[#A1A1A1]">≈ {formatUsdEquivalent(cUSDTAmount)}</span>
                {hasInsufficientBalance && <span className="font-semibold text-[#DC2626]">Insufficient Balance</span>}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-3 text-sm dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
              <div className="flex justify-between text-[#525252] dark:text-[#A1A1A1]">
                <span>Selected</span>
                <span className="font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  {selectedSide ? selectedSide.toUpperCase() : "None"}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-[#525252] dark:text-[#A1A1A1]">
                <span>Estimated Shares</span>
                <span className="font-mono text-[#0A0A0A] dark:text-[#FAFAFA]">{estimatedShares}</span>
              </div>
              {hasCreatorFee && (
                <div className="mt-2 flex justify-between text-[#525252] dark:text-[#A1A1A1]">
                  <span>Creator Fee 1%</span>
                  <span className="font-mono text-[#0A0A0A] dark:text-[#FAFAFA]">{formatCUSDT(creatorFee)}</span>
                </div>
              )}
            </div>

            {betMessage && (
              <div className="mt-3 text-sm font-semibold text-[#16A34A] dark:text-[#22C55E]">{betMessage}</div>
            )}

            <button
              type="button"
              onClick={reviewBet}
              disabled={!isMarketTradable || !selectedSide || !amount || hasInsufficientBalance || isPlacingBet}
              className="smooth-action mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
            >
              <ShieldCheck size={17} />
              {isPlacingBet
                ? "Placing Encrypted Bet..."
                : isConnected
                  ? "Place Encrypted Bet"
                  : "Connect Wallet To Predict"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};
