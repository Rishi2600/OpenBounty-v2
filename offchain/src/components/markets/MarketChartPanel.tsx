"use client";

// The big chart on the Markets page for the selected token, with range presets
// (1H, 24H, 7D, 30D) in one row above it. Switching range keeps the old chart dimmed
// until the new one loads.

import { useState } from "react";
import { Card } from "@/components/ui/card";
import FilterButtons from "@/components/common/FilterButtons";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import PriceChange from "./PriceChange";
import PriceChart from "./PriceChart";
import PriceSummary from "./PriceSummary";
import type { MarketAsset } from "@/constants/markets";
import type { ChartRange, MarketQuote } from "@/types/market";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { formatUsd } from "@/utils/format";

const RANGES: ChartRange[] = ["1H", "24H", "7D", "30D"];

interface Props {
  asset: MarketAsset;
  quote: MarketQuote | undefined;
}

export default function MarketChartPanel({ asset, quote }: Props) {
  const [range, setRange] = useState<ChartRange>("24H");
  const history = usePriceHistory(asset.id, range);

  function renderChart() {
    if (history.loading) return <Skeleton className="h-64 rounded-md" />;
    if (history.error && history.points.length === 0) {
      return <ErrorState message={history.error} onRetry={history.refetch} />;
    }
    return (
      <>
        <PriceChart points={history.points} range={range} label={`${asset.name} price`} dimmed={history.refreshing} />
        <PriceSummary points={history.points} />
      </>
    );
  }

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-2xl">{asset.name} <span className="font-sans text-base text-muted-foreground">{asset.id}</span></h2>
          {quote && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">{formatUsd(quote.priceUsd)}</span>
              <PriceChange percent={quote.change24h} />
              <span className="text-sm text-muted-foreground">24h</span>
            </div>
          )}
        </div>
        <FilterButtons
          label="Chart range"
          options={RANGES.map((value) => ({ value, label: value }))}
          value={range}
          onChange={(value) => setRange(value as ChartRange)}
        />
      </div>
      {renderChart()}
    </Card>
  );
}
