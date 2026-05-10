"use client";

const PERSISTENT_WALLET_KEY = "darkonnet:persistent-wallet";

type PersistentWalletConnection = {
  address?: string;
  connectorId?: string;
  updatedAt: number;
};

const readPersistentWalletConnection = (): PersistentWalletConnection | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PERSISTENT_WALLET_KEY);
    return raw ? (JSON.parse(raw) as PersistentWalletConnection) : null;
  } catch {
    window.localStorage.removeItem(PERSISTENT_WALLET_KEY);
    return null;
  }
};

export const rememberPersistentWalletConnection = (connection: Omit<PersistentWalletConnection, "updatedAt"> = {}) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    PERSISTENT_WALLET_KEY,
    JSON.stringify({
      ...connection,
      updatedAt: Date.now(),
    }),
  );
};

export const clearPersistentWalletConnection = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(PERSISTENT_WALLET_KEY);
};

export const shouldPersistWalletConnection = () => Boolean(readPersistentWalletConnection());
