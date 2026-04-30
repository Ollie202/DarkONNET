"use client";

export type LocalPosition = {
  id: string;
  marketId: string;
  market: string;
  status: "open" | "closed" | "completed";
  side: "Yes" | "No";
  stake: string;
  entry: string;
  current: string;
  pnl: number;
  creatorFee?: string;
  netStake?: string;
  href: string;
  createdAt: string;
};

const POSITIONS_KEY = "positions:local";

const readPositions = () => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(POSITIONS_KEY) ?? "[]") as LocalPosition[];
  } catch {
    window.localStorage.removeItem(POSITIONS_KEY);
    return [];
  }
};

export const getLocalPositions = () => readPositions();

export const saveLocalPosition = (position: LocalPosition) => {
  const positions = [position, ...readPositions()];
  window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  window.dispatchEvent(new Event("local-positions-updated"));
};

export const closeLocalPosition = (positionId: string) => {
  const positions = readPositions().map(position =>
    position.id === positionId
      ? {
          ...position,
          status: "closed" as const,
          current: position.current.startsWith("Resolved") ? position.current : `${position.current} closed`,
        }
      : position,
  );
  window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  window.dispatchEvent(new Event("local-positions-updated"));
};
