// Swap quotes from Jupiter (Solana's swap aggregator), fetched from the browser.
// Used to show what a prize is worth in another token before claiming.
// Quotes use mainnet token mints; in the preview nothing is actually swapped.

import { BN } from "@coral-xyz/anchor";
import { ASSETS, AssetId } from "@/constants/assets";
import { SWAP_SLIPPAGE_BPS } from "@/constants/markets";
import type { SwapQuote } from "@/types/market";

const QUOTE_API = "https://lite-api.jup.ag/swap/v1/quote";

export async function fetchSwapQuote(from: AssetId, to: AssetId, amount: BN): Promise<SwapQuote> {
  // Same token: nothing to swap
  if (from === to) {
    return { outAmount: amount.toString(), minReceived: amount.toString(), priceImpactPct: 0 };
  }

  const params = new URLSearchParams({
    inputMint: ASSETS[from].mainnetMint,
    outputMint: ASSETS[to].mainnetMint,
    amount: amount.toString(),
    slippageBps: String(SWAP_SLIPPAGE_BPS),
  });
  const response = await fetch(`${QUOTE_API}?${params}`);
  if (!response.ok) throw new Error("Couldn't get a swap quote right now.");

  const data = (await response.json()) as { outAmount: string; otherAmountThreshold: string; priceImpactPct: string };
  return {
    outAmount: data.outAmount,
    minReceived: data.otherAmountThreshold,
    priceImpactPct: Number(data.priceImpactPct) * 100,
  };
}
