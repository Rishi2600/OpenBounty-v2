"use client";

// Latest ecosystem news for the landing page, with loading/error state.

import { useCallback, useEffect, useState } from "react";
import type { NewsItem } from "@/types/news";
import { getNews } from "@/utils/news";

export function useNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const news = await getNews();
        if (!cancelled) setItems(news);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load news");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  return { items, loading, error, refetch };
}
