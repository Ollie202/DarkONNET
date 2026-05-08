"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useAccount } from "wagmi";
import { ThemeToggle } from "~~/components/ThemeToggle";
import { CUSDTFaucetButton } from "~~/components/faucet/CUSDTFaucetButton";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { NotificationsMenu } from "~~/components/notifications/NotificationsMenu";
import { useSidebar } from "~~/components/sidebar/SidebarContext";
import { useCUSDTBalance } from "~~/hooks/token/useCUSDTBalance";

export const Header = () => {
  const { toggle } = useSidebar();
  const { isConnected } = useAccount();
  const cUSDTBalance = useCUSDTBalance();

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
        <Link
          href="/"
          aria-label="Go to DarkONNET home"
          className="smooth-action flex h-9 min-w-0 items-center gap-2 rounded-md px-1.5 hover:bg-[#F4F4F5] dark:hover:bg-[#141414]"
        >
          <Image src="/darkonnet-hornet.jpg" alt="" width={28} height={28} className="shrink-0 rounded-md" />
          <span className="hidden truncate text-sm font-semibold tracking-tight text-[#0A0A0A] dark:text-[#FAFAFA] sm:inline">
            Dark<span className="text-[#A37500] dark:text-[#FFD60A]">ONNET</span>
          </span>
        </Link>
        <span className="hidden truncate text-sm text-[#525252] dark:text-[#A1A1A1] lg:inline">
          Private Prediction Market
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        {isConnected && (
          <button
            type="button"
            onClick={cUSDTBalance.isReady ? cUSDTBalance.refresh : cUSDTBalance.decryptBalance}
            disabled={cUSDTBalance.isLoading || cUSDTBalance.isAllowing || cUSDTBalance.isDecrypting}
            className="hidden h-9 items-center rounded-full border border-[#FFD60A]/35 bg-[#FFD60A]/10 px-4 text-sm font-semibold text-[#0A0A0A] shadow-[0_12px_30px_-24px_rgba(255,214,10,0.65)] disabled:cursor-not-allowed disabled:opacity-70 dark:text-[#FAFAFA] md:inline-flex"
            title={cUSDTBalance.isReady ? "Refresh cUSDT balance" : "Decrypt cUSDT balance"}
          >
            <span className="font-mono">
              {cUSDTBalance.isLoading
                ? "Loading cUSDT"
                : cUSDTBalance.isAllowing
                  ? "Authorizing"
                  : cUSDTBalance.isDecrypting
                    ? "Decrypting"
                    : cUSDTBalance.balanceLabel
                      ? cUSDTBalance.balanceLabel
                      : cUSDTBalance.hasHandle
                        ? "Decrypt cUSDT"
                        : "0 cUSDT"}
            </span>
          </button>
        )}
        <ThemeToggle />
        <NotificationsMenu />
        <CUSDTFaucetButton />
        <RainbowKitCustomConnectButton />
      </div>
    </header>
  );
};
