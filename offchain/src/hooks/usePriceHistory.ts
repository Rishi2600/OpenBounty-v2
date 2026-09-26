"use client";

// Price history for one token and range. Switching range keeps the previous chart on
// screen (the page dims it) until the new data arrives, instead of flashing a skeleton.

import { useCallback, useEffect, useState } from "react";
import type { MarketId } from "@/constants/markets";
import type { ChartRange, PricePoint } from "@/types/market";
import { fetchPriceHistory } from "@/utils/marketData";

interface Loaded {
  key: string;              // which token and range these points are for
  points: PricePoint[];
}

export function usePriceHistory(id: MarketId, range: ChartRange) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const key = `${id}:${range}`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const points = await fetchPriceHistory(id, range);
        if (!cancelled) setLoaded({ key: `${id}:${range}`, points });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the chart.");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, range, tick]);

  const points = loaded ? loaded.points : [];
  const loading = loaded === null && error === null;
  const refreshing = loaded !== null && loaded.key !== key && error === null;
  return { points, loading, refreshing, error, refetch };
}
