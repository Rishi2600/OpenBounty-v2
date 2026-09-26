"use client";

// Live swap quote in the claim window: about how much you'll receive, the guaranteed
// minimum, price impact, and the target token's 24-hour trend with a link to Markets.

import { BN } from "@coral-xyz/anchor";
import Sparkline from "@/components/markets/Sparkline";
import PriceChange from "@/components/markets/PriceChange";
import { ASSETS, AssetId } from "@/constants/assets";
import type { SwapQuote } from "@/types/market";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { formatAmount, formatUsd } from "@/utils/format";
import { cn } from "@/lib/utils";

// Above this, the prize is big enough to move the price noticeably
const HIGH_IMPACT_PCT = 1;

interface Props {
  to: AssetId;
  quote: SwapQuote | null;
  loading: boolean;
  error: string | null;
}

export default function SwapQuoteBox({ to, quote, loading, error }: Props) {
  const market = useMarketQuotes();
  const target = market.quotes.find((q) => q.id === to);

  let impactText = "";
  let highImpact = false;
  let usdText: string | null = null;
  if (quote) {
    impactText = quote.priceImpactPct < 0.01 ? "under 0.01%" : `${quote.priceImpactPct.toFixed(2)}%`;
    highImpact = quote.priceImpactPct >= HIGH_IMPACT_PCT;
    if (target) usdText = formatUsd((Number(quote.outAmount) / 10 ** ASSETS[to].decimals) * target.priceUsd);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/50 px-4 py-3" aria-live="polite">
      {loading && <p className="text-sm text-muted-foreground">Getting a live quote...</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {quote && (
        <>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">You&apos;ll receive about</span>
            <span className="text-2xl font-semibold">{formatAmount(new BN(quote.outAmount), to)}</span>
            {usdText && <span className="text-sm text-muted-foreground">≈ {usdText}</span>}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Minimum received</dt>
              <dd className="tabular-nums">{formatAmount(new BN(quote.minReceived), to)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Price impact</dt>
              <dd className={cn("tabular-nums", highImpact && "text-destructive")}>{impactText}</dd>
            </div>
          </dl>
          {highImpact && (
            <p className="text-sm text-destructive">
              This prize is large for the market, so the rate is noticeably worse than the chart price.
            </p>
          )}
        </>
      )}

      {target && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="w-24">
            <Sparkline prices={target.sparkline.slice(-25)} />
          </div>
          <span className="text-sm text-muted-foreground">{to} 24h</span>
          <PriceChange percent={target.change24h} className="text-sm" />
          <a href="/markets" target="_blank" rel="noreferrer" className="ml-auto text-sm text-primary underline-offset-4 hover:underline">
            See full chart
          </a>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Quote from Jupiter, updated every 10 seconds. If the price moves below the minimum
        before the swap completes, it won&apos;t go through and you can try again.
      </p>
    </div>
  );
}
