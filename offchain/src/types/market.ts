// Market data for the Markets page and the claim window.

import type { MarketId } from "@/constants/markets";

// One token's current market numbers
export interface MarketQuote {
  id: MarketId;
  priceUsd: number;
  change24h: number | null;   // percent, e.g. -0.62
  sparkline: number[];        // hourly prices for the last 7 days, oldest first
  updatedAt: Date;
}

// One point on a price chart
export interface PricePoint {
  time: number;               // unix milliseconds
  price: number;              // USD
}

export type ChartRange = "1H" | "24H" | "7D" | "30D";

// What a prize is worth after swapping it into another token (from Jupiter)
export interface SwapQuote {
  outAmount: string;          // base units of the output token, as text (can exceed JS number range)
  minReceived: string;        // lowest amount accepted before the swap fails (slippage limit)
  priceImpactPct: number;     // how much this trade moves the price, in percent
}
