// Fetching market prices (CoinGecko) from the browser. No backend and no API key.
// Results are cached for a minute so page changes don't spend the free rate limit.

import { MARKET_ASSETS, MarketId } from "@/constants/markets";
import type { ChartRange, MarketQuote, PricePoint } from "@/types/market";

const API = "https://api.coingecko.com/api/v3";
const CACHE_MS = 60_000;

const cache = new Map<string, { at: number; data: unknown }>();

async function getJson(url: string): Promise<unknown> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const response = await fetch(url);
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
  const rows = (await getJson(url)) as CoinGeckoMarket[];

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

const RANGE_DAYS: Record<ChartRange, number> = { "1H": 1, "24H": 1, "7D": 7, "30D": 30 };

// Price history for one token over a range, oldest first
export async function fetchPriceHistory(id: MarketId, range: ChartRange): Promise<PricePoint[]> {
  const asset = MARKET_ASSETS.find((a) => a.id === id);
  if (!asset) throw new Error(`Unknown market: ${id}`);

  const url = `${API}/coins/${asset.coingeckoId}/market_chart?vs_currency=usd&days=${RANGE_DAYS[range]}`;
  const data = (await getJson(url)) as { prices: [number, number][] };
  const points = data.prices.map(([time, price]) => ({ time, price }));

  // "1H" reuses the 1-day data (5-minute steps) and keeps the last hour
  if (range === "1H") {
    const since = Date.now() - 60 * 60 * 1000;
    return points.filter((point) => point.time >= since);
  }
  return points;
}
