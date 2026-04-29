"use client";

import { Droplets, Menu } from "lucide-react";
import { ThemeToggle } from "~~/components/ThemeToggle";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { NotificationsMenu } from "~~/components/notifications/NotificationsMenu";
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
        <NotificationsMenu />
        <a
          href="https://sepoliafaucet.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#E5E5E5] px-3 text-sm font-medium text-[#525252] transition-colors hover:border-[#FFD60A]/60 hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
        >
          <Droplets size={16} />
          <span className="hidden sm:inline">Faucet</span>
        </a>
        <RainbowKitCustomConnectButton />
      </div>
    </header>
  );
};
