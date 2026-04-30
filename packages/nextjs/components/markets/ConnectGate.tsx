"use client";

import Image from "next/image";
import { RainbowKitCustomConnectButton } from "~~/components/helper";

export const ConnectGate = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#FFD60A] dark:border-[#1F1F1F]">
          <Image src="/darkonnet-hornet.jpg" alt="" width={56} height={56} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
            Connect Wallet To Start Predicting Privately
          </h1>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A1]">Your bet size and side stay encrypted on-chain.</p>
        </div>
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
