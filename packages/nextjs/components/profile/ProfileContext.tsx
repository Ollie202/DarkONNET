"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ProfileContextValue = {
  profileName: string;
  bio: string;
  email: string;
  receiveUpdates: boolean;
  receivePositionNotifications: boolean;
  setProfileName: (name: string) => void;
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

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);

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

  const saveProfile = useCallback((nextProfile: ProfileSettings) => {
    const clean = cleanProfile(nextProfile);
    setProfile(clean);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(clean));
    if (clean.profileName) {
      window.localStorage.setItem(NAME_STORAGE_KEY, clean.profileName);
    } else {
      window.localStorage.removeItem(NAME_STORAGE_KEY);
    }
  }, []);

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
      setProfileName,
      saveProfile,
      clearProfileName,
    };
  }, [clearProfileName, profile, saveProfile, setProfileName]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
