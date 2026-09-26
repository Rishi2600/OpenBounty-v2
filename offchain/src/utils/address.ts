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

// The organizer's "details link" as a safe href, or null.
// Only http(s) and ipfs:// are allowed, so a "javascript:" link can never run.
export function safeDetailsUrl(uri: string): string | null {
  const text = uri.trim();
  if (text.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${text.slice("ipfs://".length)}`;
  if (text.startsWith("https://") || text.startsWith("http://")) return text;
  return null;
}

// An Ethereum-style address (Base, Ethereum, Arbitrum): 0x followed by 40 hex characters
export function isEvmAddress(text: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(text.trim());
}
