"use client";

import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { useFHECounterWagmi } from "~~/hooks/fhecounter-example/useFHECounterWagmi";

const buttonBase =
  "smooth-action inline-flex items-center justify-center px-5 py-2.5 font-medium rounded-[0.5rem] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD60A] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0A0A0A] " +
  "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
const primaryButton = `${buttonBase} bg-[#FFD60A] text-[#0A0A0A] hover:bg-[#FFD60A]/90`;
const secondaryButton = `${buttonBase} bg-white dark:bg-[#141414] text-[#0A0A0A] dark:text-[#FAFAFA] border border-[#E5E5E5] dark:border-[#1F1F1F] hover:bg-[#F4F4F5] dark:hover:bg-[#1F1F1F]`;
const successButton = `${buttonBase} bg-[#16A34A] dark:bg-[#22C55E] text-white dark:text-[#0A0A0A] hover:opacity-90`;

const sectionClass = "rounded-[0.75rem] border border-[#E5E5E5] dark:border-[#1F1F1F] bg-white dark:bg-[#141414] p-5";
const titleClass = "text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA] mb-3 lowercase";

export default function FheCounterPage() {
  const { isConnected } = useAccount();
  const fheCounter = useFHECounterWagmi();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <h2 className="text-xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA] lowercase">wallet not connected</h2>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A1] lowercase">
            connect a wallet to use the fhe counter demo
          </p>
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    );
  }

  return (
    <section className="px-6 py-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A0A0A] dark:text-[#FAFAFA] lowercase">fhe counter</h1>
        <p className="text-sm text-[#525252] dark:text-[#A1A1A1] mt-1 lowercase">
          reference demo for the fhevm encrypt/decrypt flow. kept around for the contract wiring later.
        </p>
      </header>

      <div className={`${sectionClass} mb-4`}>
        <h3 className={titleClass}>count handle</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 px-3 rounded-[0.5rem] bg-[#FAFAFA] dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1F1F1F]">
            <span className="text-sm text-[#525252] dark:text-[#A1A1A1]">encrypted handle</span>
            <span className="ml-2 font-mono text-xs text-[#0A0A0A] dark:text-[#FAFAFA]">
              {fheCounter.handle || "no handle available"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 rounded-[0.5rem] bg-[#FAFAFA] dark:bg-[#0A0A0A] border border-[#E5E5E5] dark:border-[#1F1F1F]">
            <span className="text-sm text-[#525252] dark:text-[#A1A1A1]">decrypted value</span>
            <span className="ml-2 font-mono text-xs text-[#0A0A0A] dark:text-[#FAFAFA]">
              {fheCounter.isDecrypted ? fheCounter.clear : "not decrypted yet"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          className={fheCounter.isDecrypted ? successButton : primaryButton}
          disabled={!fheCounter.canDecrypt}
          onClick={fheCounter.decryptCountHandle}
        >
          {fheCounter.canDecrypt
            ? "decrypt counter"
            : fheCounter.isDecrypted
              ? `decrypted: ${fheCounter.clear}`
              : fheCounter.isDecrypting
                ? "decrypting"
                : "nothing to decrypt"}
        </button>

        <button
          className={secondaryButton}
          disabled={!fheCounter.canUpdateCounter}
          onClick={() => fheCounter.updateCounter(+1)}
        >
          {fheCounter.canUpdateCounter ? "increment +1" : fheCounter.isProcessing ? "processing" : "cannot increment"}
        </button>

        <button
          className={secondaryButton}
          disabled={!fheCounter.canUpdateCounter}
          onClick={() => fheCounter.updateCounter(-1)}
        >
          {fheCounter.canUpdateCounter ? "decrement -1" : fheCounter.isProcessing ? "processing" : "cannot decrement"}
        </button>
      </div>

      {fheCounter.message && (
        <div className={`${sectionClass} mt-4`}>
          <h3 className={titleClass}>messages</h3>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A1]">{fheCounter.message}</p>
        </div>
      )}
    </section>
  );
}
