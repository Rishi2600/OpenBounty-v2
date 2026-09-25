// Wallet address helpers.

import { PublicKey } from "@solana/web3.js";

// Text -> PublicKey, or null when it isn't a valid address
export function parseAddress(text: string): PublicKey | null {
  try {
    return new PublicKey(text.trim());
  } catch {
    return null;
  }
}
