"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type ApiProfile, darkonnetApi } from "~~/lib/darkonnetApi";

type ProfileContextValue = {
  profileName: string;
  bio: string;
  email: string;
  profileImageDataUrl: string;
  receiveUpdates: boolean;
  receivePositionNotifications: boolean;
  walletAddress: string;
  needsUsername: boolean;
  isProfileLoading: boolean;
  profileError: string;
  loadWalletProfile: (address?: string) => void;
  setProfileName: (name: string) => void;
  saveUsernameForWallet: (name: string) => Promise<void>;
  saveProfile: (profile: ProfileSettings) => Promise<void>;
  clearProfileName: () => void;
};

export type ProfileSettings = {
  profileName: string;
  bio: string;
  email: string;
  profileImageDataUrl: string;
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
  profileImageDataUrl: "",
  receiveUpdates: true,
  receivePositionNotifications: true,
};

const cleanProfile = (profile: ProfileSettings): ProfileSettings => ({
  profileName: profile.profileName.trim(),
  bio: profile.bio.trim(),
  email: profile.email.trim(),
  profileImageDataUrl: profile.profileImageDataUrl,
  receiveUpdates: profile.receiveUpdates,
  receivePositionNotifications: profile.receivePositionNotifications,
});

const profileFromApi = (profile: ApiProfile): ProfileSettings => ({
  profileName: profile.profileName,
  bio: profile.bio,
  email: profile.email,
  profileImageDataUrl: profile.profileImageDataUrl,
  receiveUpdates: profile.receiveUpdates,
  receivePositionNotifications: profile.receivePositionNotifications,
});

const getWalletStorageKey = (address: string) => `profile:wallet:${address.toLowerCase()}`;

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [walletAddress, setWalletAddress] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const loadRequestId = useRef(0);

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

  const loadWalletProfile = useCallback(
    (address?: string) => {
      const requestId = loadRequestId.current + 1;
      loadRequestId.current = requestId;

      if (!address) {
        setWalletAddress("");
        setNeedsUsername(false);
        setIsProfileLoading(false);
        setProfileError("");
        return;
      }

      const normalizedAddress = address.toLowerCase();
      const storedProfile = window.localStorage.getItem(getWalletStorageKey(normalizedAddress));
      let cachedProfile: ProfileSettings | null = null;
      setWalletAddress(normalizedAddress);
      setProfileError("");

      if (storedProfile) {
        try {
          const nextCachedProfile = { ...defaultProfile, ...JSON.parse(storedProfile) } as ProfileSettings;
          cachedProfile = nextCachedProfile;
          setProfile(nextCachedProfile);
          setNeedsUsername(!nextCachedProfile.profileName);
        } catch {
          window.localStorage.removeItem(getWalletStorageKey(normalizedAddress));
        }
      } else {
        setProfile(defaultProfile);
        setNeedsUsername(false);
      }

      setIsProfileLoading(true);
      darkonnetApi
        .getProfile(normalizedAddress)
        .then(apiProfile => {
          if (loadRequestId.current !== requestId) return;
          const nextProfile = profileFromApi(apiProfile);
          const profileToMigrate = cachedProfile?.profileName ? cachedProfile : null;
          if (!nextProfile.profileName && profileToMigrate) {
            return darkonnetApi.saveProfile(normalizedAddress, profileToMigrate).then(savedProfile => {
              if (loadRequestId.current !== requestId) return;
              const migratedProfile = profileFromApi(savedProfile);
              setProfile(migratedProfile);
              persistProfile(migratedProfile, normalizedAddress);
              setNeedsUsername(!migratedProfile.profileName);
            });
          }

          setProfile(nextProfile);
          persistProfile(nextProfile, normalizedAddress);
          setNeedsUsername(!nextProfile.profileName);
        })
        .catch(error => {
          if (loadRequestId.current !== requestId) return;
          console.warn("Unable to load backend profile.", error);
          if (!cachedProfile) {
            setProfile(defaultProfile);
          }
          setNeedsUsername(!(cachedProfile?.profileName || storedProfile));
        })
        .finally(() => {
          if (loadRequestId.current === requestId) setIsProfileLoading(false);
        });
    },
    [persistProfile],
  );

  const saveProfile = useCallback(
    async (nextProfile: ProfileSettings) => {
      const clean = cleanProfile(nextProfile);
      if (!walletAddress) {
        setProfile(clean);
        persistProfile(clean);
        setNeedsUsername(!clean.profileName);
        return;
      }

      setIsProfileLoading(true);
      setProfileError("");
      try {
        const savedProfile = await darkonnetApi.saveProfile(walletAddress, clean);
        const nextSavedProfile = profileFromApi(savedProfile);
        setProfile(nextSavedProfile);
        persistProfile(nextSavedProfile, walletAddress);
        setNeedsUsername(!nextSavedProfile.profileName);
      } catch (error) {
        console.warn("Unable to sync backend profile. Saved profile locally.", error);
        setProfile(clean);
        persistProfile(clean, walletAddress);
        setNeedsUsername(!clean.profileName);
      } finally {
        setIsProfileLoading(false);
      }
    },
    [persistProfile, walletAddress],
  );

  const saveUsernameForWallet = useCallback(
    async (name: string) => {
      await saveProfile({ ...profile, profileName: name });
    },
    [profile, saveProfile],
  );

  const setProfileName = useCallback(
    (name: string) => {
      void saveProfile({ ...profile, profileName: name });
    },
    [profile, saveProfile],
  );

  const clearProfileName = useCallback(() => {
    void saveProfile({ ...profile, profileName: "" });
    window.localStorage.removeItem(NAME_STORAGE_KEY);
  }, [profile, saveProfile]);

  const value = useMemo(() => {
    return {
      ...profile,
      walletAddress,
      needsUsername,
      isProfileLoading,
      profileError,
      loadWalletProfile,
      setProfileName,
      saveUsernameForWallet,
      saveProfile,
      clearProfileName,
    };
  }, [
    clearProfileName,
    loadWalletProfile,
    isProfileLoading,
    needsUsername,
    profile,
    profileError,
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
