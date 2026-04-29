"use client";

// @refresh reset
import { useEffect, useRef, useState } from "react";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, LogOut, Save, UserRound, Wallet } from "lucide-react";
import { getAddress } from "viem";
import { useDisconnect } from "wagmi";
import { BlockieAvatar } from "~~/components/helper";
import { useProfile } from "~~/components/profile/ProfileContext";
import { useOutsideClick } from "~~/hooks/helper";
import { useTargetNetwork } from "~~/hooks/helper/useTargetNetwork";

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

/**
 * Custom Wagmi Connect Button with profile-first identity.
 */
export const RainbowKitCustomConnectButton = () => {
  const { targetNetwork } = useTargetNetwork();
  const { profileName, setProfileName, clearProfileName } = useProfile();
  const { disconnect } = useDisconnect();
  const [draftName, setDraftName] = useState(profileName);
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setDraftName(profileName);
  }, [profileName]);

  useOutsideClick(dropdownRef, () => dropdownRef.current?.removeAttribute("open"));

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        if (!connected) {
          return (
            <button
              className="h-9 cursor-pointer rounded-md border-none bg-[#FFD208] px-3 text-sm font-semibold text-gray-900"
              onClick={openConnectModal}
              type="button"
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported || chain.id !== targetNetwork.id) {
          return <WrongNetworkDropdown />;
        }

        const checkSumAddress = getAddress(account.address);
        const fallbackName = account.ensName || account.displayName || shortAddress(account.address);
        const displayName = profileName || fallbackName;

        return (
          <details ref={dropdownRef} className="dropdown dropdown-end relative z-[100]">
            <summary className="flex h-9 max-w-[13rem] cursor-pointer list-none items-center gap-2 rounded-md border border-[#E5E5E5] bg-[#F4F4F5] px-2 text-sm font-semibold text-[#0A0A0A] shadow-sm transition-colors hover:border-[#FFD60A]/60 dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#FAFAFA]">
              <BlockieAvatar address={checkSumAddress} size={24} ensImage={account.ensAvatar} />
              <span className="hidden max-w-32 truncate sm:block">{displayName}</span>
              <ChevronDown size={15} className="text-[#525252] dark:text-[#A1A1A1]" />
            </summary>

            <div className="dropdown-content z-[100] mt-2 w-[20rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-[0_18px_50px_-28px_rgba(10,10,10,0.5)] dark:border-[#1F1F1F] dark:bg-[#141414]">
              <div className="border-b border-[#E5E5E5] p-4 dark:border-[#1F1F1F]">
                <div className="flex items-center gap-3">
                  <BlockieAvatar address={checkSumAddress} size={38} ensImage={account.ensAvatar} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                      {displayName}
                    </div>
                    <div className="mt-1 font-mono text-xs text-[#525252] dark:text-[#A1A1A1]">
                      {shortAddress(account.address)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <label className="block">
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#525252] dark:text-[#A1A1A1]">
                    <UserRound size={14} />
                    Profile Name
                  </span>
                  <input
                    value={draftName}
                    onChange={event => setDraftName(event.target.value)}
                    placeholder={fallbackName}
                    className="mt-2 h-10 w-full rounded-md border border-[#E5E5E5] bg-white px-3 text-sm text-[#0A0A0A] outline-none focus:border-[#FFD60A] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
                  />
                </label>

                <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-3 text-xs text-[#525252] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} />
                    {chain.name}
                  </div>
                  <div className="mt-2 break-all font-mono">{checkSumAddress}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileName(draftName)}
                    className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFD60A]/90"
                  >
                    <Save size={15} />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearProfileName();
                      setDraftName("");
                    }}
                    className="h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] transition-colors hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                  >
                    Use Address
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#DC2626]/30 text-sm font-semibold text-[#DC2626] transition-colors hover:bg-[#DC2626]/10 dark:text-[#EF4444]"
                >
                  <LogOut size={15} />
                  Disconnect
                </button>
              </div>
            </div>
          </details>
        );
      }}
    </ConnectButton.Custom>
  );
};
