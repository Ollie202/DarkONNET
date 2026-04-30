"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ProfileContextValue = {
  profileName: string;
  bio: string;
  email: string;
  receiveUpdates: boolean;
  receivePositionNotifications: boolean;
  walletAddress: string;
  needsUsername: boolean;
  loadWalletProfile: (address?: string) => void;
  setProfileName: (name: string) => void;
  saveUsernameForWallet: (name: string) => void;
  saveProfile: (profile: ProfileSettings) => void;
  clearProfileName: () => void;
};

export type ProfileSettings = {
  profileName: string;
  bio: string;
  email: string;
  receiveUpdates: boolean;
  receivePositionNotifications: boolean;
};

const NAME_STORAGE_KEY = "profile:name";
const PROFILE_STORAGE_KEY = "profile:settings";
const ProfileContext = createContext<ProfileContextValue | null>(null);

const defaultProfile: ProfileSettings = {
  profileName: "",
  bio: "",
  email: "",
  receiveUpdates: true,
  receivePositionNotifications: true,
};

const cleanProfile = (profile: ProfileSettings): ProfileSettings => ({
  profileName: profile.profileName.trim(),
  bio: profile.bio.trim(),
  email: profile.email.trim(),
  receiveUpdates: profile.receiveUpdates,
  receivePositionNotifications: profile.receivePositionNotifications,
});

const getWalletStorageKey = (address: string) => `profile:wallet:${address.toLowerCase()}`;

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [walletAddress, setWalletAddress] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const storedName = window.localStorage.getItem(NAME_STORAGE_KEY) ?? "";

    if (storedProfile) {
      try {
        setProfile({ ...defaultProfile, ...JSON.parse(storedProfile) });
        return;
      } catch {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    setProfile(prev => ({ ...prev, profileName: storedName }));
  }, []);

  const persistProfile = useCallback(
    (nextProfile: ProfileSettings, address = walletAddress) => {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      if (address) window.localStorage.setItem(getWalletStorageKey(address), JSON.stringify(nextProfile));
      if (nextProfile.profileName) window.localStorage.setItem(NAME_STORAGE_KEY, nextProfile.profileName);
    },
    [walletAddress],
  );

  const loadWalletProfile = useCallback((address?: string) => {
    if (!address) {
      setWalletAddress("");
      setNeedsUsername(false);
      return;
    }

    const normalizedAddress = address.toLowerCase();
    const storedProfile = window.localStorage.getItem(getWalletStorageKey(normalizedAddress));
    setWalletAddress(normalizedAddress);

    if (storedProfile) {
      try {
        const nextProfile = { ...defaultProfile, ...JSON.parse(storedProfile) };
        setProfile(nextProfile);
        setNeedsUsername(!nextProfile.profileName);
        return;
      } catch {
        window.localStorage.removeItem(getWalletStorageKey(normalizedAddress));
      }
    }

    setProfile(defaultProfile);
    setNeedsUsername(true);
  }, []);

  const saveProfile = useCallback(
    (nextProfile: ProfileSettings) => {
      const clean = cleanProfile(nextProfile);
      setProfile(clean);
      persistProfile(clean);
      setNeedsUsername(!clean.profileName);
    },
    [persistProfile],
  );

  const saveUsernameForWallet = useCallback(
    (name: string) => {
      saveProfile({ ...profile, profileName: name });
    },
    [profile, saveProfile],
  );

  const setProfileName = useCallback(
    (name: string) => {
      saveProfile({ ...profile, profileName: name });
    },
    [profile, saveProfile],
  );

  const clearProfileName = useCallback(() => {
    saveProfile({ ...profile, profileName: "" });
    window.localStorage.removeItem(NAME_STORAGE_KEY);
  }, [profile, saveProfile]);

  const value = useMemo(() => {
    return {
      ...profile,
      walletAddress,
      needsUsername,
      loadWalletProfile,
      setProfileName,
      saveUsernameForWallet,
      saveProfile,
      clearProfileName,
    };
  }, [
    clearProfileName,
    loadWalletProfile,
    needsUsername,
    profile,
    saveProfile,
    saveUsernameForWallet,
    setProfileName,
    walletAddress,
  ]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
