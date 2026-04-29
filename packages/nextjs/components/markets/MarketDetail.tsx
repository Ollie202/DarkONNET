"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Lock, MessageCircle, ShieldCheck, ThumbsUp } from "lucide-react";
import { fallbackImages, marketImages } from "~~/components/markets/MarketCard";
import { SentimentBar, useLiveProbability } from "~~/components/markets/SentimentBar";
import { useNotifications } from "~~/components/notifications/NotificationsContext";
import { type Market, formatTimeRemaining } from "~~/lib/mockMarkets";

type SelectedSide = "yes" | "no" | null;
type AmountMode = "token" | "usd";
type CommentSort = "top" | "new";
type CommentSide = "Yes" | "No" | "Watching";

type MarketComment = {
  id: string;
  author: string;
  side: CommentSide;
  createdAt: number;
  time: string;
  text: string;
  likes: number;
  liked: boolean;
  replies: MarketReply[];
};

type MarketReply = {
  id: string;
  author: string;
  time: string;
  text: string;
  replies: MarketReply[];
};

type MarketDetailProps = {
  market: Market;
};

const presetAmounts = [1, 5, 10, 20, 50];

const walletTokens = [
  { symbol: "ETH", label: "Sepolia ETH", balance: 0.42, usdPrice: 3380 },
  { symbol: "USDC", label: "Mock USDC", balance: 250, usdPrice: 1 },
  { symbol: "ZAMA", label: "Test ZAMA", balance: 1000, usdPrice: 0.12 },
];

const sampleComments: MarketComment[] = [
  {
    id: "comment-1",
    author: "0x81...F2a9",
    side: "Yes",
    createdAt: Date.now() - 12 * 60 * 1000,
    time: "12m ago",
    text: "The news flow feels tilted toward Yes, but I want to see one more confirmation before sizing up.",
    likes: 18,
    liked: false,
    replies: [
      {
        id: "reply-1",
        author: "0x09...a612",
        time: "5m ago",
        text: "Same read here. I think the next benchmark print decides this.",
        replies: [
          {
            id: "reply-1-1",
            author: "0x81...F2a9",
            time: "2m ago",
            text: "Exactly. The resolution wording matters more than the headline itself.",
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "comment-2",
    author: "0x44...91cB",
    side: "No",
    createdAt: Date.now() - 28 * 60 * 1000,
    time: "28m ago",
    text: "Market is overreacting to headlines. The actual resolution criteria still looks hard to satisfy.",
    likes: 11,
    liked: false,
    replies: [],
  },
  {
    id: "comment-3",
    author: "0xA7...0e31",
    side: "Watching",
    createdAt: Date.now() - 60 * 60 * 1000,
    time: "1h ago",
    text: "Good market, but the final source used for resolution needs to be very explicit.",
    likes: 7,
    liked: false,
    replies: [],
  },
];

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
  marketDescriptions[market.id] ??
  `This market resolves according to credible public reporting and the stated resolution date. The outcome should be judged from reliable sources relevant to ${market.signalLabel.toLowerCase()}.`;

const formatCategory = (category: Market["category"]) => category[0].toUpperCase() + category.slice(1);

export const MarketDetail = ({ market }: MarketDetailProps) => {
  const { addNotification } = useNotifications();
  const searchParams = useSearchParams();
  const probability = useLiveProbability(market.yesProbability, market.sentimentSignals);
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const initialSide = searchParams.get("side");
  const [selectedSide, setSelectedSide] = useState<SelectedSide>(
    initialSide === "yes" || initialSide === "no" ? initialSide : null,
  );
  const [selectedToken, setSelectedToken] = useState(walletTokens[0].symbol);
  const [amountMode, setAmountMode] = useState<AmountMode>("usd");
  const [amount, setAmount] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSort, setCommentSort] = useState<CommentSort>("top");
  const [comments, setComments] = useState<MarketComment[]>(sampleComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const imageUrl = marketImages[market.id] ?? fallbackImages[market.category];
  const selectedTokenInfo = walletTokens.find(token => token.symbol === selectedToken) ?? walletTokens[0];
  const parsedAmount = Number(amount);
  const tokenAmount = amountMode === "token" ? parsedAmount || 0 : (parsedAmount || 0) / selectedTokenInfo.usdPrice;
  const usdAmount = amountMode === "usd" ? parsedAmount || 0 : (parsedAmount || 0) * selectedTokenInfo.usdPrice;
  const hasInsufficientBalance = tokenAmount > selectedTokenInfo.balance;

  useEffect(() => {
    const side = searchParams.get("side");
    setSelectedSide(side === "yes" || side === "no" ? side : null);
  }, [searchParams]);

  const estimatedShares = useMemo(() => {
    if (!usdAmount || !selectedSide || hasInsufficientBalance) return "0.00";
    const price = selectedSide === "yes" ? probability : 1 - probability;
    return (usdAmount / Math.max(price, 0.01)).toFixed(2);
  }, [hasInsufficientBalance, probability, selectedSide, usdAmount]);

  const formatTokenBalance = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  const formatUsd = (value: number) =>
    value.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 1 ? 2 : 4,
    });

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (commentSort === "new") return b.createdAt - a.createdAt;
      return b.likes - a.likes || b.createdAt - a.createdAt;
    });
  }, [commentSort, comments]);

  const addComment = () => {
    const text = commentDraft.trim();
    if (!text) return;

    const side: CommentSide = selectedSide === "yes" ? "Yes" : selectedSide === "no" ? "No" : "Watching";

    setComments(prev => [
      {
        id: `comment-${Date.now()}`,
        author: "You",
        side,
        createdAt: Date.now(),
        time: "Just now",
        text,
        likes: 0,
        liked: false,
        replies: [],
      },
      ...prev,
    ]);
    setCommentDraft("");
    setCommentSort("new");
  };

  const addReply = (targetId: string) => {
    const text = replyDrafts[targetId]?.trim();
    if (!text) return;

    const findReplyAuthor = (replies: MarketReply[]): string | undefined => {
      for (const reply of replies) {
        if (reply.id === targetId) return reply.author;
        const nestedAuthor = findReplyAuthor(reply.replies);
        if (nestedAuthor) return nestedAuthor;
      }
      return undefined;
    };

    const parentComment = comments.find(comment => comment.id === targetId);
    const parentAuthor =
      parentComment?.author ?? comments.map(comment => findReplyAuthor(comment.replies)).find(Boolean);
    const replyAuthor = parentAuthor === "You" ? "0x44...91cB" : "You";
    const nextReply: MarketReply = {
      id: `reply-${Date.now()}`,
      author: replyAuthor,
      time: "Just now",
      text,
      replies: [],
    };

    const addNestedReply = (replies: MarketReply[]): MarketReply[] =>
      replies.map(reply =>
        reply.id === targetId
          ? { ...reply, replies: [...reply.replies, nextReply] }
          : { ...reply, replies: addNestedReply(reply.replies) },
      );

    setComments(prev =>
      prev.map(comment =>
        comment.id === targetId
          ? {
              ...comment,
              replies: [...comment.replies, nextReply],
            }
          : { ...comment, replies: addNestedReply(comment.replies) },
      ),
    );

    if (parentAuthor === "You") {
      addNotification({
        title: "Reply On Your Comment",
        message: `${replyAuthor} replied to your comment on "${market.question}"`,
        time: "Just now",
      });
    }

    setReplyDrafts(prev => ({ ...prev, [targetId]: "" }));
    setReplyingTo(null);
  };

  const toggleLike = (commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              liked: !comment.liked,
              likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment,
      ),
    );
  };

  const renderReplies = (replies: MarketReply[], depth = 0) => {
    if (replies.length === 0) return null;

    return (
      <div className={`mt-3 space-y-2 border-l border-[#E5E5E5] pl-3 dark:border-[#1F1F1F] ${depth > 0 ? "ml-2" : ""}`}>
        {replies.map(reply => (
          <div key={reply.id} className="rounded-md bg-white p-3 dark:bg-[#141414]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">{reply.author}</span>
              <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">{reply.time}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#525252] dark:text-[#A1A1A1]">{reply.text}</p>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#525252] transition-colors hover:bg-[#F8FAFC] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#0A0A0A] dark:hover:text-[#FFD60A]"
              >
                <MessageCircle size={13} />
                Reply
              </button>
            </div>

            {replyingTo === reply.id && (
              <div className="mt-3 flex gap-2 border-l border-[#FFD60A]/50 pl-3">
                <textarea
                  value={replyDrafts[reply.id] ?? ""}
                  onChange={event => setReplyDrafts(prev => ({ ...prev, [reply.id]: event.target.value }))}
                  placeholder={`Reply to ${reply.author}...`}
                  className="min-h-16 flex-1 resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                />
                <button
                  type="button"
                  onClick={() => addReply(reply.id)}
                  disabled={!replyDrafts[reply.id]?.trim()}
                  className="h-10 cursor-pointer rounded-md bg-[#FFD60A] px-3 text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFD60A]/90 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  Send
                </button>
              </div>
            )}

            {renderReplies(reply.replies, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="px-6 py-6 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 lg:overflow-y-auto lg:pr-2">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#525252] transition-colors hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
          >
            <ArrowLeft size={16} />
            Back To Markets
          </Link>

          <div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div
              className="relative h-56 bg-center bg-no-repeat md:h-72"
              style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "100% auto" }}
            >
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
                </div>
                <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-white md:text-3xl">
                  {market.question}
                </h1>
              </div>
            </div>

            <div className="space-y-6 p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-3">
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
                    {formatTimeRemaining(market.endsAt)}
                  </div>
                </div>
              </div>

              <SentimentBar probability={probability} signals={market.sentimentSignals} />

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
                    Resolves Yes if the condition in the market title is confirmed by reliable public reporting before
                    the resolution date. Otherwise, it resolves No.
                  </p>
                  <p>
                    Ambiguous reporting, conflicting sources, or incomplete data should be settled by the clearest
                    primary or widely cited public source available at resolution.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Comments</h2>
                  <div className="flex rounded-md border border-[#E5E5E5] p-0.5 text-xs font-semibold dark:border-[#1F1F1F]">
                    {(["top", "new"] as CommentSort[]).map(sort => (
                      <button
                        key={sort}
                        onClick={() => setCommentSort(sort)}
                        className={`h-7 rounded px-3 ${
                          commentSort === sort
                            ? "bg-[#FFD60A] text-[#0A0A0A]"
                            : "text-[#525252] transition-colors hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD60A] text-sm font-bold text-[#0A0A0A]">
                      You
                    </div>
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
                          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-[#FFD60A] px-3 text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFD60A]/90 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                        >
                          <MessageCircle size={15} />
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {sortedComments.map(comment => (
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

                          <div className="mt-3 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#525252] transition-colors hover:bg-white hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
                            >
                              <MessageCircle size={13} />
                              Reply
                            </button>
                            {comment.replies.length > 0 && (
                              <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">
                                {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLike(comment.id)}
                          aria-pressed={comment.liked}
                          className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors ${
                            comment.liked
                              ? "border-[#FFD60A]/70 bg-[#FFD60A]/15 text-[#0A0A0A] dark:text-[#FFD60A]"
                              : "border-[#E5E5E5] text-[#525252] hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                          }`}
                        >
                          <ThumbsUp size={13} className={comment.liked ? "fill-current" : ""} />
                          {comment.likes}
                        </button>
                      </div>

                      {renderReplies(comment.replies)}

                      {replyingTo === comment.id && (
                        <div className="mt-3 flex gap-2 border-l border-[#FFD60A]/50 pl-3">
                          <textarea
                            value={replyDrafts[comment.id] ?? ""}
                            onChange={event => setReplyDrafts(prev => ({ ...prev, [comment.id]: event.target.value }))}
                            placeholder={`Reply to ${comment.author}...`}
                            className="min-h-16 flex-1 resize-y rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#FAFAFA]"
                          />
                          <button
                            type="button"
                            onClick={() => addReply(comment.id)}
                            disabled={!replyDrafts[comment.id]?.trim()}
                            className="h-10 cursor-pointer rounded-md bg-[#FFD60A] px-3 text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFD60A]/90 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:h-full lg:overflow-y-auto lg:pr-1">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-[0_18px_50px_-36px_rgba(10,10,10,0.55)] dark:border-[#1F1F1F] dark:bg-[#141414]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Place Bet</h2>
                <p className="mt-1 text-xs text-[#525252] dark:text-[#A1A1A1]">
                  No side is selected until you choose one.
                </p>
              </div>
              <Lock size={18} className="text-[#FFD60A]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSide("yes")}
                className={`h-11 cursor-pointer rounded-md border px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
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
                className={`h-11 cursor-pointer rounded-md border px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
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
              <select
                value={selectedToken}
                onChange={event => setSelectedToken(event.target.value)}
                className="mt-2 h-11 w-full cursor-pointer rounded-md border border-[#E5E5E5] bg-white px-3 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
              >
                {walletTokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.label}
                  </option>
                ))}
              </select>
              <span className="mt-2 flex justify-between text-xs text-[#525252] dark:text-[#A1A1A1]">
                <span>
                  Balance {formatTokenBalance(selectedTokenInfo.balance)} {selectedTokenInfo.symbol}
                </span>
                <span>{formatUsd(selectedTokenInfo.balance * selectedTokenInfo.usdPrice)}</span>
              </span>
            </label>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Amount</span>
                <div className="grid grid-cols-2 rounded-md border border-[#E5E5E5] p-0.5 text-xs font-semibold dark:border-[#1F1F1F]">
                  {(["usd", "token"] as AmountMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAmount("");
                        setAmountMode(mode);
                      }}
                      className={`h-7 cursor-pointer rounded px-3 transition-colors ${
                        amountMode === mode
                          ? "bg-[#FFD60A] text-[#0A0A0A]"
                          : "text-[#525252] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                      }`}
                    >
                      {mode === "usd" ? "USD" : selectedTokenInfo.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] transition-colors hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                  >
                    {amountMode === "usd" ? `$${preset}` : `${preset} ${selectedTokenInfo.symbol}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      amountMode === "usd"
                        ? String((selectedTokenInfo.balance * selectedTokenInfo.usdPrice).toFixed(2))
                        : String(selectedTokenInfo.balance),
                    )
                  }
                  className="h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] transition-colors hover:border-[#FFD60A]/60 hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
                >
                  Max
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                placeholder={amountMode === "usd" ? "Enter USD amount" : `Enter ${selectedTokenInfo.symbol} amount`}
                className={`mt-3 h-12 w-full rounded-md border bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:bg-[#0A0A0A] dark:text-[#FAFAFA] ${
                  hasInsufficientBalance ? "border-[#DC2626]" : "border-[#E5E5E5] dark:border-[#1F1F1F]"
                }`}
              />
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-[#525252] dark:text-[#A1A1A1]">
                  {amountMode === "usd"
                    ? `${formatTokenBalance(tokenAmount)} ${selectedTokenInfo.symbol}`
                    : formatUsd(usdAmount)}
                </span>
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
            </div>

            <button
              type="button"
              disabled={!selectedSide || !amount || hasInsufficientBalance}
              className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFD60A]/90 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <ShieldCheck size={17} />
              Review Encrypted Bet
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};
