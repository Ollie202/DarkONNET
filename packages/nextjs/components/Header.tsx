"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "~~/components/ThemeToggle";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { useSidebar } from "~~/components/sidebar/SidebarContext";

export const Header = () => {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 shrink-0 border-b border-[#E5E5E5] dark:border-[#1F1F1F] bg-white dark:bg-[#0A0A0A] px-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="toggle sidebar"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-[#0A0A0A] dark:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#141414] hover:text-[#0A0A0A] dark:hover:text-[#FFD60A] transition-colors"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm text-[#525252] dark:text-[#A1A1A1]">Prediction Market</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <RainbowKitCustomConnectButton />
      </div>
    </header>
  );
};
