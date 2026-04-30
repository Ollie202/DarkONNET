"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  type CreateMarketDraft,
  clearCreateMarketDraft,
  createMarketFromDraft,
  emptyCreateMarketDraft,
  getCreateMarketDraft,
  saveCreateMarketDraft,
  saveLocalMarket,
} from "~~/lib/localMarkets";
import type { MarketCategory } from "~~/lib/mockMarkets";

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
  const [draft, setDraft] = useState<CreateMarketDraft>(() =>
    typeof window === "undefined" ? emptyCreateMarketDraft : getCreateMarketDraft(),
  );
  const [formMessage, setFormMessage] = useState("");

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

  const saveDraft = () => {
    saveCreateMarketDraft(draft);
    setFormMessage("Draft saved locally.");
  };

  const submitMarket = () => {
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

    const market = createMarketFromDraft(draft);
    saveLocalMarket(market);
    clearCreateMarketDraft();
    setDraft(emptyCreateMarketDraft);
    router.push(`/markets/${market.id}`);
  };

  return (
    <section className="px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Create New Market</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#525252] dark:text-[#A1A1A1]">
            Draft a market with clear rules, credible sources, and resolution timing before it goes live.
          </p>
        </header>

        <form className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-[0_18px_50px_-36px_rgba(10,10,10,0.45)] dark:border-[#1F1F1F] dark:bg-[#141414]">
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
              <label className="smooth-action mt-2 flex h-11 w-fit cursor-pointer items-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-[#FFD60A]/70 dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                <ImageIcon size={17} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={event => updateDraft("coverImageName", event.target.files?.[0]?.name ?? "")}
                />
              </label>
              {draft.coverImageName && (
                <div className="mt-2 text-xs font-medium text-[#525252] dark:text-[#A1A1A1]">
                  {draft.coverImageName}
                </div>
              )}
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
              At the presale end date, the market can launch pending approval if the soft cap is met. If not, funds are
              refunded. The resolution date should be at least 24 hours after presale ends.
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  Soft Cap
                  <FieldTooltip label="Minimum funding required before the market can launch. If the cap is not met, presale funds are refunded." />
                </span>
                <input
                  type="number"
                  value={draft.softCap}
                  onChange={event => updateDraft("softCap", event.target.value)}
                  placeholder="1000"
                  className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
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
                  <option>Testnet ETH</option>
                  <option>Mock USDC</option>
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
                className="smooth-action h-11 cursor-pointer rounded-md bg-[#FFD60A] px-5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
              >
                Submit Market
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
