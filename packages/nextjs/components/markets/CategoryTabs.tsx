"use client";

import { Flame, TrendingUp } from "lucide-react";
import type { MarketCategory } from "~~/lib/mockMarkets";

export type CategoryFilter = "all" | "trending" | MarketCategory;

type Tab = {
  id: CategoryFilter;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

const tabs: Tab[] = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "all", label: "All", icon: Flame },
  { id: "politics", label: "Politics" },
  { id: "sports", label: "Sports" },
  { id: "crypto", label: "Crypto" },
  { id: "tech", label: "Tech" },
  { id: "finance", label: "Finance" },
  { id: "geopolitics", label: "Geopolitics" },
  { id: "culture", label: "Culture" },
  { id: "esports", label: "Esports" },
];

type CategoryTabsProps = {
  active: CategoryFilter;
  onChange: (id: CategoryFilter) => void;
};

export const CategoryTabs = ({ active, onChange }: CategoryTabsProps) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-[#E5E5E5] dark:border-[#1F1F1F] -mx-6 px-6 py-2">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const isFirstSeparator = i === 2;
        return (
          <div key={tab.id} className="flex items-center">
            {isFirstSeparator && <span className="mx-2 h-4 w-px bg-[#E5E5E5] dark:bg-[#1F1F1F]" />}
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-[#0A0A0A] text-white dark:bg-[#FAFAFA] dark:text-[#0A0A0A]"
                  : "text-[#525252] dark:text-[#A1A1A1] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#141414]"
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? "" : "text-[#FFD60A]"} />}
              <span>{tab.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
