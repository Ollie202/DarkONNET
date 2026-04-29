"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ProfileContextValue = {
  profileName: string;
  setProfileName: (name: string) => void;
  clearProfileName: () => void;
};

const STORAGE_KEY = "profile:name";
const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profileName, setProfileNameState] = useState("");

  useEffect(() => {
    setProfileNameState(window.localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  const setProfileName = useCallback((name: string) => {
    const clean = name.trim();
    setProfileNameState(clean);
    if (clean) {
      window.localStorage.setItem(STORAGE_KEY, clean);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearProfileName = useCallback(() => {
    setProfileNameState("");
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ profileName, setProfileName, clearProfileName }),
    [clearProfileName, profileName, setProfileName],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
