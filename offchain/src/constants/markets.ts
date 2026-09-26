// Tokens on the Markets page: every asset a prize can be claimed in, plus BTC and ETH
// as reference points (you can't claim in those). Prices come from CoinGecko's free API.

import type { AssetId } from "./assets";

export type MarketId = AssetId | "BTC" | "ETH";

export interface MarketAsset {
  id: MarketId;
  name: string;
  coingeckoId: string;
  claimable: boolean;   // false = shown for reference only
}

export const MARKET_ASSETS: MarketAsset[] = [
  { id: "SOL",  name: "Solana",     coingeckoId: "solana",                  claimable: true },
  { id: "USDC", name: "USD Coin",   coingeckoId: "usd-coin",                claimable: true },
  { id: "USDT", name: "Tether USD", coingeckoId: "tether",                  claimable: true },
  { id: "BONK", name: "Bonk",       coingeckoId: "bonk",                    claimable: true },
  { id: "JUP",  name: "Jupiter",    coingeckoId: "jupiter-exchange-solana", claimable: true },
  { id: "BTC",  name: "Bitcoin",    coingeckoId: "bitcoin",                 claimable: false },
  { id: "ETH",  name: "Ethereum",   coingeckoId: "ethereum",                claimable: false },
];

// Market prices refresh this often (the free API is rate-limited, so not faster)
export const MARKETS_REFRESH_MS = 60_000;

// Swap quotes in the claim window refresh this often
export const QUOTE_REFRESH_MS = 10_000;

// Largest price move allowed during a swap before it fails: 50 basis points = 0.5%
export const SWAP_SLIPPAGE_BPS = 50;

export const PRICE_SOURCE = { name: "CoinGecko", url: "https://www.coingecko.com" };
