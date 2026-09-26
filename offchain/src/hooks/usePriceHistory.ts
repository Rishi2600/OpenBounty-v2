"use client";

// Fetched price history for one token and range (only used for 1H and 30D; 24H and 7D
// come from the market quotes). While a new choice loads, the previous chart stays up
// (the page dims it), and `shownId`/`shownRange` say what those points actually are.

import { useCallback, useEffect, useState } from "react";
import type { MarketId } from "@/constants/markets";
import type { ChartRange, PricePoint } from "@/types/market";
import { fetchPriceHistory } from "@/utils/marketData";

interface Loaded {
  id: MarketId;
  range: ChartRange;
  points: PricePoint[];
}

export function usePriceHistory(id: MarketId, range: ChartRange, enabled: boolean) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const points = await fetchPriceHistory(id, range);
        if (!cancelled) setLoaded({ id, range, points });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the chart.");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, range, enabled, tick]);

  const isCurrent = loaded !== null && loaded.id === id && loaded.range === range;
  return {
    points: loaded ? loaded.points : [],
    shownId: loaded ? loaded.id : null,
    shownRange: loaded ? loaded.range : null,
    loading: enabled && loaded === null && error === null,
    refreshing: enabled && loaded !== null && !isCurrent && error === null,
    error: enabled ? error : null,
    refetch,
  };
}
