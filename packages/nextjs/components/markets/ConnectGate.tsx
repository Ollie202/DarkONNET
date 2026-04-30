"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { RainbowKitCustomConnectButton } from "~~/components/helper";

export const ConnectGate = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full border border-[#E5E5E5] dark:border-[#1F1F1F] bg-white dark:bg-[#141414] text-[#FFD60A]">
          <Lock size={20} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
            Connect Your Wallet To Start Betting
          </h1>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A1]">Your bet size and side stay encrypted on-chain.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <RainbowKitCustomConnectButton />
          <Link
            href="/admin-market-requests"
            className="smooth-action inline-flex h-10 items-center justify-center rounded-md border border-[#E5E5E5] px-4 text-sm font-semibold text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FFD60A]"
          >
            Admin Demo
          </Link>
        </div>
      </div>
    </div>
  );
};
