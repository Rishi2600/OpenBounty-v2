"use client";

// Live Jupiter quote for swapping a prize into another token, refreshed every 10 seconds.
// Pass amount = null to skip (for example while the claim window is closed).

import { useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";
import type { AssetId } from "@/constants/assets";
import { QUOTE_REFRESH_MS } from "@/constants/markets";
import type { SwapQuote } from "@/types/market";
import { fetchSwapQuote } from "@/utils/swap";

export function useSwapQuote(from: AssetId, to: AssetId, amount: BN | null) {
  const [result, setResult] = useState<{ key: string; quote: SwapQuote } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);

  const amountText = amount ? amount.toString() : null;
  const key = `${from}:${to}:${amountText}`;

  useEffect(() => {
    if (!amountText) return;
    const amountToQuote = amountText;
    let cancelled = false;
    const thisKey = `${from}:${to}:${amountToQuote}`;

    async function load() {
      try {
        const quote = await fetchSwapQuote(from, to, new BN(amountToQuote));
        if (cancelled) return;
        setResult({ key: thisKey, quote });
        setFailure(null);
      } catch (err) {
        if (!cancelled) setFailure({ key: thisKey, message: err instanceof Error ? err.message : "Couldn't get a quote." });
      }
    }

    load();
    const timer = setInterval(load, QUOTE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [from, to, amountText]);

  // Ignore results that belong to an earlier choice of token or amount
  const quote = result && result.key === key ? result.quote : null;
  const error = failure && failure.key === key ? failure.message : null;
  const loading = amountText !== null && quote === null && error === null;
  return { quote, loading, error };
}
