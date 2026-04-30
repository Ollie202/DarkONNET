"use client";

// @refresh reset
import { useEffect, useRef, useState } from "react";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Check, ChevronDown, Clipboard, ClipboardCheck, LogOut, UserRound, Wallet } from "lucide-react";
import { getAddress } from "viem";
import { useDisconnect } from "wagmi";
import { BlockieAvatar } from "~~/components/helper";
import { useProfile } from "~~/components/profile/ProfileContext";
import { useOutsideClick } from "~~/hooks/helper";
import { useTargetNetwork } from "~~/hooks/helper/useTargetNetwork";

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const ProfileAvatar = ({
  address,
  ensImage,
  imageDataUrl,
  size,
}: {
  address: string;
  ensImage?: string;
  imageDataUrl?: string;
  size: number;
}) =>
  imageDataUrl ? (
    <span
      aria-hidden="true"
      className="shrink-0 overflow-hidden rounded-full bg-cover bg-center"
      style={{ width: size, height: size, backgroundImage: `url(${imageDataUrl})` }}
    />
  ) : (
    <BlockieAvatar address={address} size={size} ensImage={ensImage} />
  );

type ConnectedMenuProps = {
  account: {
    address: string;
    ensAvatar?: string | null;
  };
};

/**
 * Custom Wagmi Connect Button with profile-first identity.
 */
export const RainbowKitCustomConnectButton = () => {
  const { targetNetwork } = useTargetNetwork();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        if (!connected) {
          return (
            <button
              className="smooth-action h-9 cursor-pointer rounded-md border-none bg-[#FFD208] px-3 text-sm font-semibold text-gray-900"
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
        return <ConnectedProfileMenu account={{ ...account, address: checkSumAddress }} />;
      }}
    </ConnectButton.Custom>
  );
};

const ConnectedProfileMenu = ({ account }: ConnectedMenuProps) => {
  const { disconnect } = useDisconnect();
  const { profileImageDataUrl, profileName, needsUsername, loadWalletProfile, saveUsernameForWallet } = useProfile();
  const [usernameDraft, setUsernameDraft] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    loadWalletProfile(account.address);
  }, [account.address, loadWalletProfile]);

  useEffect(() => {
    setUsernameDraft(profileName);
  }, [profileName]);

  useOutsideClick(dropdownRef, () => dropdownRef.current?.removeAttribute("open"));

  const displayName = profileName || "Choose Username";

  return (
    <>
      {needsUsername && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-[#1F1F1F] bg-[#141414] p-5 shadow-[0_24px_80px_-40px_rgba(255,214,10,0.55)]">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                address={account.address}
                size={36}
                ensImage={account.ensAvatar ?? undefined}
                imageDataUrl={profileImageDataUrl}
              />
              <div>
                <h2 className="text-lg font-semibold text-[#FAFAFA]">Choose Username</h2>
                <p className="mt-1 text-xs text-[#A1A1A1]">{shortAddress(account.address)} is new here.</p>
              </div>
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[#FAFAFA]">Username</span>
              <input
                value={usernameDraft}
                onChange={event => setUsernameDraft(event.target.value)}
                autoFocus
                placeholder="MacroMira"
                className="mt-2 h-11 w-full rounded-md border border-[#1F1F1F] bg-[#0A0A0A] px-3 text-sm text-[#FAFAFA] outline-none focus:border-[#FFD60A]"
              />
            </label>
            <button
              type="button"
              onClick={() => saveUsernameForWallet(usernameDraft)}
              disabled={!usernameDraft.trim()}
              className="smooth-action mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#FFD60A] text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90"
            >
              <Check size={16} />
              Continue
            </button>
          </div>
        </div>
      )}

      <details ref={dropdownRef} className="dropdown dropdown-end relative z-[100]">
        <summary className="smooth-action flex h-9 max-w-[13rem] cursor-pointer list-none items-center gap-2 rounded-md border border-[#E5E5E5] bg-[#F4F4F5] px-2 text-sm font-semibold text-[#0A0A0A] shadow-sm hover:border-[#FFD60A]/60 dark:border-[#1F1F1F] dark:bg-[#141414] dark:text-[#FAFAFA]">
          <ProfileAvatar
            address={account.address}
            size={24}
            ensImage={account.ensAvatar ?? undefined}
            imageDataUrl={profileImageDataUrl}
          />
          <span className="hidden max-w-32 truncate sm:block">{displayName}</span>
          <ChevronDown size={15} className="text-[#525252] dark:text-[#A1A1A1]" />
        </summary>

        <div className="dropdown-content z-[100] mt-2 w-[20rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-[0_18px_50px_-28px_rgba(10,10,10,0.5)] dark:border-[#1F1F1F] dark:bg-[#141414]">
          <div className="border-b border-[#E5E5E5] p-4 dark:border-[#1F1F1F]">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                address={account.address}
                size={38}
                ensImage={account.ensAvatar ?? undefined}
                imageDataUrl={profileImageDataUrl}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">{displayName}</div>
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
                value={displayName}
                readOnly
                className="mt-2 h-10 w-full cursor-default rounded-md border border-[#E5E5E5] bg-[#F8FAFC] px-3 text-sm text-[#0A0A0A] outline-none dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#FAFAFA]"
              />
            </label>

            <div className="rounded-md border border-[#E5E5E5] bg-[#F8FAFC] p-3 text-xs text-[#525252] dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Wallet size={14} />
                  Wallet Address
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(account.address);
                    setCopiedAddress(true);
                    window.setTimeout(() => setCopiedAddress(false), 1200);
                  }}
                  className="smooth-action inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#525252] hover:bg-white hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
                  aria-label="copy wallet address"
                  title="Copy Address"
                >
                  {copiedAddress ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
                </button>
              </div>
              <div className="mt-2 break-all font-mono">{account.address}</div>
            </div>

            {confirmingDisconnect ? (
              <div className="rounded-md border border-[#DC2626]/30 bg-[#DC2626]/5 p-3">
                <p className="text-sm font-semibold text-[#DC2626] dark:text-[#EF4444]">
                  Are you sure you want to disconnect?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDisconnect(false)}
                    className="smooth-action h-9 cursor-pointer rounded-md border border-[#E5E5E5] text-sm font-semibold text-[#525252] hover:text-[#0A0A0A] dark:border-[#1F1F1F] dark:text-[#A1A1A1] dark:hover:text-[#FAFAFA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => disconnect()}
                    className="smooth-action flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#DC2626] text-sm font-semibold text-white hover:bg-[#DC2626]/90"
                  >
                    <LogOut size={15} />
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDisconnect(true)}
                className="smooth-action flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#DC2626]/30 text-sm font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 dark:text-[#EF4444]"
              >
                <LogOut size={15} />
                Disconnect
              </button>
            )}
          </div>
        </div>
      </details>
    </>
  );
};
