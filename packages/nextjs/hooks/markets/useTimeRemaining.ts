"use client";

import { useEffect, useState } from "react";
import { formatTimeRemaining } from "~~/lib/mockMarkets";

export const useTimeRemaining = (endsAt: string) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();

    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  return formatTimeRemaining(endsAt, now);
};
