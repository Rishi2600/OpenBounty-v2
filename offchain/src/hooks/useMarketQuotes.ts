"use client";

// Current price, 24h change and 7-day sparkline for every Markets token, refreshed every
// minute. While refreshing, the previous numbers stay on screen (no flash).

import { useCallback, useEffect, useState } from "react";
import { MARKETS_REFRESH_MS } from "@/constants/markets";
import type { MarketQuote } from "@/types/market";
import { fetchMarketQuotes } from "@/utils/marketData";

export function useMarketQuotes() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchMarketQuotes();
        if (cancelled) return;
        setQuotes(next);
        setError(null);
        setUpdatedAt(new Date());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load prices.");
      }
    }

    load();
    const timer = setInterval(load, MARKETS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tick]);

  // Only the very first load shows a loading state; later refreshes keep the old numbers
  const loading = quotes.length === 0 && error === null;
  return { quotes, loading, error, updatedAt, refetch };
}
