// Fetching market prices (CoinGecko) from the browser. No backend and no API key.
// The free API is rate-limited, and a rate-limited reply has no CORS header, so the browser
// reports it as a network error. To stay under the limit: one request gives every token's
// price plus 7 days of hourly prices (used for the 24H and 7D charts), only 1H and 30D
// charts fetch history, and results are cached.

import { MARKET_ASSETS, MarketId } from "@/constants/markets";
import type { ChartRange, MarketQuote, PricePoint } from "@/types/market";

const API = "https://api.coingecko.com/api/v3";
const PRICES_CACHE_MS = 60_000;
const HISTORY_CACHE_MS = 5 * 60_000;
const HOUR_MS = 60 * 60 * 1000;

const cache = new Map<string, { at: number; data: unknown }>();

async function getJson(url: string, cacheMs: number): Promise<unknown> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < cacheMs) return hit.data;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    // Usually the rate limit (its reply has no CORS header), sometimes a real network problem
    throw new Error("Couldn't reach the price service. It may be busy; try again in a minute.");
  }
  if (response.status === 429) throw new Error("The price service is busy. Try again in a minute.");
  if (!response.ok) throw new Error(`The price service returned an error (${response.status}).`);

  const data: unknown = await response.json();
  cache.set(url, { at: Date.now(), data });
  return data;
}

interface CoinGeckoMarket {
  id: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d: { price: number[] };
  last_updated: string;
}

// Current price, 24h change and a 7-day sparkline for every Markets token, in one request
export async function fetchMarketQuotes(): Promise<MarketQuote[]> {
  const ids = MARKET_ASSETS.map((asset) => asset.coingeckoId).join(",");
  const url = `${API}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`;
  const rows = (await getJson(url, PRICES_CACHE_MS)) as CoinGeckoMarket[];

  const quotes: MarketQuote[] = [];
  for (const asset of MARKET_ASSETS) {
    const row = rows.find((r) => r.id === asset.coingeckoId);
    if (!row) continue;
    quotes.push({
      id: asset.id,
      priceUsd: row.current_price,
      change24h: row.price_change_percentage_24h,
      sparkline: row.sparkline_in_7d.price,
      updatedAt: new Date(row.last_updated),
    });
  }
  return quotes;
}

// 24H and 7D charts come from the hourly prices already in MarketQuote.sparkline
export function isSparklineRange(range: ChartRange): boolean {
  return range === "24H" || range === "7D";
}

// Chart points from a quote's 7-day hourly prices, ending at the quote's update time
export function pointsFromSparkline(quote: MarketQuote, range: ChartRange): PricePoint[] {
  const hours = range === "24H" ? 24 : quote.sparkline.length - 1;
  const prices = quote.sparkline.slice(-(hours + 1));
  const end = quote.updatedAt.getTime();
  return prices.map((price, i) => ({ time: end - (prices.length - 1 - i) * HOUR_MS, price }));
}

// Price history for the ranges the sparkline can't cover (1H, 30D), oldest first
export async function fetchPriceHistory(id: MarketId, range: ChartRange): Promise<PricePoint[]> {
  const asset = MARKET_ASSETS.find((a) => a.id === id);
  if (!asset) throw new Error(`Unknown market: ${id}`);

  const days = range === "30D" ? 30 : 1;
  const url = `${API}/coins/${asset.coingeckoId}/market_chart?vs_currency=usd&days=${days}`;
  const data = (await getJson(url, HISTORY_CACHE_MS)) as { prices: [number, number][] };
  const points = data.prices.map(([time, price]) => ({ time, price }));

  // "1H" reuses the 1-day data (5-minute steps) and keeps the last hour
  if (range === "1H") {
    const since = Date.now() - 60 * 60 * 1000;
    return points.filter((point) => point.time >= since);
  }
  return points;
}
