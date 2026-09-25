// Display helpers: SOL amounts, deadlines and addresses.

import { BN } from "@coral-xyz/anchor";
import type { PrizeTier } from "@/types/escrow";

const LAMPORTS_PER_SOL = 1_000_000_000;

// 50000000000 -> "50 SOL", 12500000000 -> "12.5 SOL"
export function formatSol(lamports: BN | number): string {
  const raw = typeof lamports === "number" ? lamports : lamports.toNumber();
  const sol = raw / LAMPORTS_PER_SOL;
  const text = sol % 1 === 0 ? sol.toFixed(0) : sol.toFixed(2).replace(/\.?0+$/, "");
  return `${text} SOL`;
}

// Sum of every tier's prize
export function totalLocked(tiers: PrizeTier[]): BN {
  return tiers.reduce((sum, tier) => sum.add(tier.amount), new BN(0));
}

// Sum of the prizes not yet claimed
export function unclaimedTotal(tiers: PrizeTier[]): BN {
  return tiers
    .filter((tier) => !tier.claimed)
    .reduce((sum, tier) => sum.add(tier.amount), new BN(0));
}

// Deadline relative to now: "12 days left", "3 hours left", "Ended 2 days ago"
export function formatDeadline(deadline: BN): string {
  const diffMs  = deadline.toNumber() * 1000 - Date.now();
  const seconds = Math.floor(Math.abs(diffMs) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(seconds / 3600);
  const days    = Math.floor(seconds / 86400);

  let amount = "";
  if (days > 0) amount = `${days} day${days === 1 ? "" : "s"}`;
  else if (hours > 0) amount = `${hours} hour${hours === 1 ? "" : "s"}`;
  else if (minutes > 0) amount = `${minutes} min`;

  if (diffMs > 0) return amount ? `${amount} left` : "Ending now";
  return amount ? `Ended ${amount} ago` : "Ended just now";
}

// Full date in the viewer's locale, e.g. "Oct 9, 2026, 6:00 PM"
export function formatDate(deadline: BN): string {
  return new Date(deadline.toNumber() * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// 0 -> "1st prize", 1 -> "2nd prize", ...
const PLACE_LABELS = ["1st prize", "2nd prize", "3rd prize", "4th prize"];

export function placeLabel(index: number): string {
  return PLACE_LABELS[index] ?? `Prize ${index + 1}`;
}

// "4BagKz...35Hp" -> "4Bag...35Hp"
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
