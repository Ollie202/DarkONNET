"use client";

import type { Market } from "~~/lib/mockMarkets";

type MatchupVisualProps = {
  fallbackImageUrl: string;
  market: Market;
  variant?: "card" | "hero";
};

const initials = (name?: string) =>
  (name || "Team")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "T";

const TeamMark = ({ logoUrl, name, variant }: { logoUrl?: string; name?: string; variant: "card" | "hero" }) => (
  <div className="flex min-w-0 flex-col items-center gap-2">
    <div
      className={`grid place-items-center rounded-lg border border-white/15 bg-white shadow-sm dark:border-[#2A2A2A] dark:bg-[#FAFAFA] ${
        variant === "hero" ? "h-24 w-24 md:h-32 md:w-32" : "h-16 w-16"
      }`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-[72%] w-[72%] object-contain" />
      ) : (
        <span className="font-mono text-lg font-semibold text-[#0A0A0A]">{initials(name)}</span>
      )}
    </div>
    <span
      className={`max-w-full truncate text-center font-semibold text-white ${
        variant === "hero" ? "text-sm md:text-base" : "text-[11px]"
      }`}
    >
      {name || "Team"}
    </span>
  </div>
);

export const hasMatchupVisual = (market: Market) =>
  (market.category === "sports" || market.category === "esports") && Boolean(market.homeName && market.awayName);

export const MatchupVisual = ({ fallbackImageUrl, market, variant = "card" }: MatchupVisualProps) => {
  if (!hasMatchupVisual(market)) {
    return (
      <div
        aria-hidden="true"
        className={`w-full bg-center bg-no-repeat opacity-90 transition-transform duration-200 ease-out group-hover:scale-[1.02] ${
          variant === "hero" ? "h-56 md:h-72" : "h-32"
        }`}
        style={{ backgroundImage: `url(${fallbackImageUrl})`, backgroundSize: "cover" }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#0A0A0A] ${variant === "hero" ? "h-56 md:h-72" : "h-32"}`}
    >
      <div className="absolute inset-0 bg-[#16A34A]/24" style={{ clipPath: "polygon(0 0, 45% 0, 61% 100%, 0 100%)" }}>
        <div className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-center px-3">
          <TeamMark logoUrl={market.homeLogoUrl} name={market.homeName} variant={variant} />
        </div>
      </div>
      <div
        className="absolute inset-0 bg-[#DC2626]/24"
        style={{ clipPath: "polygon(39% 0, 100% 0, 100% 100%, 55% 100%)" }}
      >
        <div className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center px-3">
          <TeamMark logoUrl={market.awayLogoUrl} name={market.awayName} variant={variant} />
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-white/20 bg-[#0A0A0A]/65 px-2 py-1 shadow-sm">
        <span className={`font-mono font-semibold text-[#FFD60A] ${variant === "hero" ? "text-lg" : "text-xs"}`}>
          VS
        </span>
      </div>
    </div>
  );
};
