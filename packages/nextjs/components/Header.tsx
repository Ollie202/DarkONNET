"use client";

import { Droplets, Menu } from "lucide-react";
import { ThemeToggle } from "~~/components/ThemeToggle";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { NotificationsMenu } from "~~/components/notifications/NotificationsMenu";
import { useSidebar } from "~~/components/sidebar/SidebarContext";

export const Header = () => {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-[80] flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#E5E5E5] bg-white px-2 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] sm:px-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="toggle sidebar"
          className="smooth-action hidden h-9 w-9 items-center justify-center rounded-md text-[#0A0A0A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:text-[#FAFAFA] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A] md:inline-flex"
        >
          <Menu size={18} />
        </button>
        <span className="truncate text-sm text-[#525252] dark:text-[#A1A1A1]">Prediction Market</span>
      </div>
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <NotificationsMenu />
        <a
          href="https://sepoliafaucet.com/"
          target="_blank"
          rel="noreferrer"
          className="smooth-action inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#E5E5E5] px-3 text-sm font-medium text-[#525252] hover:border-[#FFD60A]/60 hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
        >
          <Droplets size={16} />
          <span className="hidden sm:inline">Faucet</span>
        </a>
        <RainbowKitCustomConnectButton />
      </div>
    </header>
  );
};
