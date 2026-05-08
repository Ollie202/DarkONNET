"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEncrypt } from "@zama-fhe/react-sdk";
import {
  Bold,
  Calendar,
  ImageIcon,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Plus,
  Strikethrough,
  Underline,
  X,
} from "lucide-react";
import { bytesToHex, parseUnits } from "viem";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useProfile } from "~~/components/profile/ProfileContext";
import { ConfidentialPredictionMarket } from "~~/contracts/ConfidentialPredictionMarket";
import { EncryptedERC20 } from "~~/contracts/EncryptedERC20";
import { darkonnetApi } from "~~/lib/darkonnetApi";
import {
  type CreateMarketDraft,
  clearCreateMarketDraft,
  createMarketFromDraft,
  emptyCreateMarketDraft,
  getCreateMarketDraft,
  getMarketRequestCooldown,
  saveCreateMarketDraft,
} from "~~/lib/localMarkets";
import type { MarketCategory } from "~~/lib/mockMarkets";
import { PLATFORM_TOKEN_SYMBOL } from "~~/lib/token";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { sepolia } from "~~/utils/chains";
import { deploymentFor } from "~~/utils/contract";

const categories: Array<{ value: MarketCategory; label: string }> = [
  { value: "crypto", label: "Crypto" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "tech", label: "Tech" },
  { value: "finance", label: "Finance" },
  { value: "geopolitics", label: "Geopolitics" },
  { value: "culture", label: "Culture" },
  { value: "esports", label: "Esports" },
];

const toolbar = [
  { label: "Bold", icon: Bold },
  { label: "Italic", icon: Italic },
  { label: "Underline", icon: Underline },
  { label: "Strike", icon: Strikethrough },
  { label: "Ordered list", icon: ListOrdered },
  { label: "List", icon: List },
  { label: "Link", icon: LinkIcon },
];

const MAX_SOURCES = 10;
const UINT64_MAX = 18_446_744_073_709_551_615n;
const marketContract = deploymentFor(ConfidentialPredictionMarket, sepolia.id);
const cUSDTContract = deploymentFor(EncryptedERC20, sepolia.id);

const formatRemaining = (remainingMs: number) => {
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const FieldTooltip = ({ label }: { label: string }) => (
  <span className="group relative inline-flex">
    <Info size={14} className="cursor-help text-[#525252] dark:text-[#A1A1A1]" />
    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-medium leading-5 text-[#525252] opacity-0 shadow-[0_18px_50px_-28px_rgba(10,10,10,0.5)] transition-opacity group-hover:opacity-100 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
      {label}
    </span>
  </span>
);

export default function CreateMarketPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const encrypt = useEncrypt();
  const { walletAddress } = useProfile();
  const creatorKey = address || walletAddress;
  const [draft, setDraft] = useState<CreateMarketDraft>(() =>
    typeof window === "undefined" ? emptyCreateMarketDraft : getCreateMarketDraft(),
  );
  const [formMessage, setFormMessage] = useState("");
  const [submittedMarketId, setSubmittedMarketId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(() =>
    typeof window === "undefined" ? { canSubmit: true, remainingMs: 0 } : getMarketRequestCooldown(creatorKey),
  );

  const creatorStake = 1;

  useEffect(() => {
    setCooldown(getMarketRequestCooldown(creatorKey));
  }, [creatorKey]);

  const updateDraft = <Key extends keyof CreateMarketDraft>(key: Key, value: CreateMarketDraft[Key]) => {
    setFormMessage("");
    setDraft(currentDraft => ({ ...currentDraft, [key]: value }));
  };

  const updateSource = (index: number, value: string) => {
    updateDraft(
      "sources",
      draft.sources.map((source, sourceIndex) => (sourceIndex === index ? value : source)),
    );
  };

  const addSource = () => {
    updateDraft("sources", draft.sources.length >= MAX_SOURCES ? draft.sources : [...draft.sources, ""]);
  };

  const removeSource = (index: number) => {
    updateDraft(
      "sources",
      draft.sources.filter((_, sourceIndex) => sourceIndex !== index),
    );
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormMessage("");
      setDraft(currentDraft => ({
        ...currentDraft,
        coverImageName: file.name,
        coverImageDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveDraft = () => {
    saveCreateMarketDraft(draft);
    setFormMessage("Draft saved locally.");
  };

  const submitMarket = async () => {
    if (!isConnected) {
      setFormMessage("Connect your wallet to submit a market creation request.");
      openConnectModal?.();
      return;
    }

    if (!creatorKey) {
      setFormMessage("Your connected wallet address is still loading. Try again in a moment.");
      return;
    }

    const nextCooldown = getMarketRequestCooldown(creatorKey);
    setCooldown(nextCooldown);

    if (!nextCooldown.canSubmit) {
      setFormMessage(
        `You can submit one market request every 24 hours. Try again in ${formatRemaining(nextCooldown.remainingMs)}.`,
      );
      return;
    }

    if (
      !draft.question.trim() ||
      !draft.category ||
      !draft.rules.trim() ||
      !draft.presaleEndDate ||
      !draft.resolutionDate
    ) {
      setFormMessage("Add a question, category, rules, presale end date, and resolution date before submitting.");
      return;
    }

    const activeSources = draft.sources.map(s => s.trim()).filter(Boolean);
    const uniqueSources = new Set(activeSources);
    if (uniqueSources.size !== activeSources.length) {
      setFormMessage("Please remove duplicate source links before submitting.");
      return;
    }

    if (!marketContract || !cUSDTContract) {
      setFormMessage("DarkONNET market contracts are not configured for Sepolia.");
      return;
    }
    if (chainId !== sepolia.id) {
      setFormMessage("Switch your wallet to Sepolia before submitting this market request.");
      return;
    }

    let escrowedMarketId: bigint | undefined;
    try {
      setIsSubmitting(true);
      const market = createMarketFromDraft(draft, { creatorKey });
      if (!market.onchainMarketId) {
        throw new Error("Unable to derive the on-chain market ID for this request.");
      }

      market.creatorStake = creatorStake;
      const stakeUnits = parseUnits(String(creatorStake), 6);
      if (stakeUnits <= 0n || stakeUnits > UINT64_MAX) {
        throw new Error(`Enter a positive ${PLATFORM_TOKEN_SYMBOL} stake that fits the encrypted token limit.`);
      }

      setFormMessage("Encrypting creator stake approval...");
      const approvalInput = await encrypt.mutateAsync({
        values: [{ value: stakeUnits, type: "euint64" }],
        contractAddress: cUSDTContract.address,
        userAddress: creatorKey as `0x${string}`,
      });

      setFormMessage("Approving encrypted cUSDT stake...");
      const approvalHash = await writeContractAsync({
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
      await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash, chainId: sepolia.id });

      setFormMessage("Depositing encrypted creator stake...");

      const stakeHash = await writeContractAsync({
        address: marketContract.address,
        abi: marketContract.abi,
        functionName: "depositCreatorStake",
        args: [BigInt(market.onchainMarketId)],
        chainId: sepolia.id,
        gas: 15_000_000n,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: stakeHash, chainId: sepolia.id });
      escrowedMarketId = BigInt(market.onchainMarketId);
      window.dispatchEvent(new Event("darkonnet:cusdt-balance-refresh"));

      setFormMessage("Saving market request to backend...");
      await darkonnetApi.upsertMarket(market);
      setCooldown(getMarketRequestCooldown(creatorKey));
      clearCreateMarketDraft();
      setDraft(emptyCreateMarketDraft);
      setSubmittedMarketId(market.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to submit this market to the backend.";
      if (escrowedMarketId && marketContract) {
        try {
          setFormMessage("Backend request failed after funding. Returning creator stake...");
          const withdrawHash = await writeContractAsync({
            address: marketContract.address,
            abi: marketContract.abi,
            functionName: "withdrawCreatorStake",
            args: [escrowedMarketId],
            chainId: sepolia.id,
            gas: 3_000_000n,
          });
          await waitForTransactionReceipt(wagmiConfig, { hash: withdrawHash, chainId: sepolia.id });
          window.dispatchEvent(new Event("darkonnet:cusdt-balance-refresh"));
          setFormMessage(`${message} Creator stake was returned.`);
        } catch {
          setFormMessage(
            `${message} Creator stake is escrowed on-chain; withdraw it before resubmitting this exact request.`,
          );
        }
      } else {
        setFormMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-5 sm:px-6 sm:py-6">
      {submittedMarketId && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[#1F1F1F] bg-[#141414] p-5 shadow-[0_24px_80px_-40px_rgba(255,214,10,0.55)]">
            <h2 className="text-xl font-semibold text-[#FAFAFA]">Market Request Submitted</h2>
            <p className="mt-3 text-sm leading-6 text-[#A1A1A1]">
              Your market has been submitted and will be reviewed by an admin in under 24 hours.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/creator-markets")}
                className="smooth-action h-10 rounded-md border border-[#334155] text-sm font-semibold text-[#FAFAFA] hover:border-[#FFD60A]/70"
              >
                View My Markets
              </button>
              <button
                type="button"
                onClick={() => setSubmittedMarketId("")}
                className="smooth-action h-10 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A]"
              >
                Create Another Later
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Create New Market</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#525252] dark:text-[#A1A1A1]">
            Draft a market with clear rules, credible sources, resolution timing, and a 1 {PLATFORM_TOKEN_SYMBOL}{" "}
            minimum wallet-backed request.
          </p>
        </header>

        <form className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-[0_18px_50px_-36px_rgba(10,10,10,0.45)] dark:border-[#1F1F1F] dark:bg-[#141414] sm:p-6">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                Market Question Title <span className="text-[#EF4444]">*</span>
              </span>
              <input
                type="text"
                value={draft.question}
                onChange={event => updateDraft("question", event.target.value)}
                placeholder="Enter the question..."
                className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                Category <span className="text-[#EF4444]">*</span>
              </span>
              <select
                value={draft.category}
                onChange={event => updateDraft("category", event.target.value as MarketCategory)}
                className="mt-2 h-11 w-full cursor-pointer rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-medium text-[#0A0A0A] outline-none transition-colors focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Cover Image</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <label className="smooth-action flex h-40 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-md border border-dashed border-[#CBD5E1] bg-white text-sm font-semibold text-[#0A0A0A] hover:border-[#FFD60A]/70 dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                  {draft.coverImageDataUrl ? (
                    <span
                      aria-hidden="true"
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${draft.coverImageDataUrl})` }}
                    />
                  ) : (
                    <>
                      <ImageIcon size={22} />
                      Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={event => handleImageUpload(event.target.files?.[0])}
                  />
                </label>
                <div className="flex min-w-0 flex-col justify-center rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#525252] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
                  <div className="font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                    {draft.coverImageName || "No image selected"}
                  </div>
                  <p className="mt-2">
                    Tap upload on mobile or desktop to choose a cover image. The preview will appear here before you
                    submit the request.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Sources</span>
              <div className="mt-2 space-y-2">
                {draft.sources.map((source, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex h-11 flex-1 items-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 dark:border-[#334155] dark:bg-[#020817]">
                      <LinkIcon size={16} className="shrink-0 text-[#525252] dark:text-[#A1A1A1]" />
                      <input
                        type="url"
                        value={source}
                        onChange={event => updateSource(index, event.target.value)}
                        placeholder="https://example.com/source"
                        className="w-full bg-transparent text-sm text-[#0A0A0A] outline-none placeholder:text-[#94A3B8] dark:text-[#FAFAFA]"
                      />
                    </div>
                    {draft.sources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSource(index)}
                        aria-label="remove source"
                        className="smooth-action flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-[#CBD5E1] text-[#525252] hover:border-[#DC2626]/60 hover:text-[#DC2626] dark:border-[#334155] dark:text-[#A1A1A1] dark:hover:text-[#EF4444]"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSource}
                disabled={draft.sources.length >= MAX_SOURCES}
                className="smooth-action mt-2 flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-[#FFD60A]/70 dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
              >
                <Plus size={18} />
                Add Source {draft.sources.length}/{MAX_SOURCES}
              </button>
            </div>

            <div>
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                Rules <span className="text-[#EF4444]">*</span>
              </span>
              <div className="mt-2 overflow-hidden rounded-md border border-[#CBD5E1] bg-white dark:border-[#334155] dark:bg-[#020817]">
                <div className="flex h-12 items-center gap-1 border-b border-[#CBD5E1] px-3 dark:border-[#334155]">
                  {toolbar.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={item.label}
                        title={item.label}
                        className="smooth-action flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#525252] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={draft.rules}
                  onChange={event => updateDraft("rules", event.target.value)}
                  placeholder="Rules..."
                  className="min-h-44 w-full resize-y bg-transparent px-4 py-4 text-sm text-[#0A0A0A] outline-none placeholder:text-[#94A3B8] dark:text-[#FAFAFA]"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  Presale End Date <span className="text-[#EF4444]">*</span>
                </span>
                <div className="mt-2 flex h-11 items-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                  <Calendar size={16} className="text-[#525252] dark:text-[#A1A1A1]" />
                  <input
                    type="datetime-local"
                    value={draft.presaleEndDate}
                    onChange={event => updateDraft("presaleEndDate", event.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  Resolution Date <span className="text-[#EF4444]">*</span>
                </span>
                <div className="mt-2 flex h-11 items-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                  <Calendar size={16} className="text-[#525252] dark:text-[#A1A1A1]" />
                  <input
                    type="datetime-local"
                    value={draft.resolutionDate}
                    onChange={event => updateDraft("resolutionDate", event.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </label>
            </div>

            <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#525252] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
              Market creation requests require a minimum 1 {PLATFORM_TOKEN_SYMBOL} wallet-backed stake. The request
              deposits that stake into the prediction market escrow, stays pending until an admin approves it, and
              approved creator markets earn 1% of each trade back to the creator wallet.
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  Creator Stake
                  <FieldTooltip
                    label={`Minimum ${PLATFORM_TOKEN_SYMBOL} amount deposited as encrypted escrow before the backend request is saved.`}
                  />
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value="1"
                  readOnly
                  placeholder="1"
                  className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-sm text-[#0A0A0A] outline-none dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
                />
              </label>
              <div className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  Initial Yes Odds
                  <FieldTooltip label="New binary markets start balanced at 50/50. After launch, odds move based on normal prediction market trading activity." />
                </span>
                <div className="mt-2 flex h-11 items-center rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#525252] dark:border-[#334155] dark:bg-[#020817] dark:text-[#A1A1A1]">
                  Fixed at 50%
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Token</span>
                <select
                  value={draft.token}
                  onChange={event => updateDraft("token", event.target.value)}
                  className="mt-2 h-11 w-full cursor-pointer rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
                >
                  <option>{PLATFORM_TOKEN_SYMBOL}</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E5E5E5] pt-5 dark:border-[#1F1F1F] sm:flex-row sm:justify-end">
              {formMessage && (
                <div className="mr-auto flex min-h-11 items-center text-sm font-semibold text-[#525252] dark:text-[#A1A1A1]">
                  {formMessage}
                </div>
              )}
              <button
                type="button"
                onClick={saveDraft}
                className="smooth-action h-11 cursor-pointer rounded-md border border-[#CBD5E1] px-5 text-sm font-semibold text-[#525252] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:border-[#334155] dark:text-[#A1A1A1] dark:hover:bg-[#0A0A0A] dark:hover:text-[#FAFAFA]"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={submitMarket}
                disabled={!cooldown.canSubmit || isSubmitting}
                className="smooth-action h-11 cursor-pointer rounded-md bg-[#FFD60A] px-5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Funding Request..."
                  : cooldown.canSubmit
                    ? "Submit And Fund Request"
                    : `Available In ${formatRemaining(cooldown.remainingMs)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
