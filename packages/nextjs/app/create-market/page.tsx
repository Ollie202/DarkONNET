"use client";

import {
  Bold,
  Calendar,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Plus,
  Strikethrough,
  Underline,
} from "lucide-react";
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

export default function CreateMarketPage() {
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
                placeholder="Enter the question..."
                className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                Category <span className="text-[#EF4444]">*</span>
              </span>
              <select className="mt-2 h-11 w-full cursor-pointer rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-medium text-[#0A0A0A] outline-none transition-colors focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                <option>Select category</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Cover Image</span>
              <button
                type="button"
                className="smooth-action mt-2 flex h-11 cursor-pointer items-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-[#FFD60A]/70 dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
              >
                <ImageIcon size={17} />
                Upload
              </button>
            </div>

            <div>
              <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Sources</span>
              <button
                type="button"
                className="smooth-action mt-2 flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] hover:border-[#FFD60A]/70 dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
              >
                <Plus size={18} />
                Add More Source
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
                  <input type="datetime-local" className="w-full bg-transparent outline-none" />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  Resolution Date <span className="text-[#EF4444]">*</span>
                </span>
                <div className="mt-2 flex h-11 items-center gap-3 rounded-md border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#0A0A0A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                  <Calendar size={16} className="text-[#525252] dark:text-[#A1A1A1]" />
                  <input type="datetime-local" className="w-full bg-transparent outline-none" />
                </div>
              </label>
            </div>

            <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#525252] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
              At the presale end date, the market can launch pending approval if the soft cap is met. If not, funds are
              refunded. The resolution date should be at least 24 hours after presale ends.
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Soft Cap</span>
                <input
                  type="number"
                  placeholder="1000"
                  className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Initial Yes Odds</span>
                <input
                  type="number"
                  placeholder="50"
                  className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Token</span>
                <select className="mt-2 h-11 w-full cursor-pointer rounded-md border border-[#CBD5E1] bg-white px-4 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#334155] dark:bg-[#020817] dark:text-[#FAFAFA]">
                  <option>Testnet ETH</option>
                  <option>Mock USDC</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E5E5E5] pt-5 dark:border-[#1F1F1F] sm:flex-row sm:justify-end">
              <button
                type="button"
                className="smooth-action h-11 cursor-pointer rounded-md border border-[#CBD5E1] px-5 text-sm font-semibold text-[#525252] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:border-[#334155] dark:text-[#A1A1A1] dark:hover:bg-[#0A0A0A] dark:hover:text-[#FAFAFA]"
              >
                Save Draft
              </button>
              <button
                type="button"
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
