import { BN } from "@coral-xyz/anchor";
import { PrizeTier } from "@/hooks/useAllEscrows";

// Types

export type BountyStatus = "active" | "claimed" | "expired";

// Status derivation
//
// active  — deadline has not passed AND at least one tier is unclaimed
// claimed — ALL tiers are claimed (regardless of deadline)
// expired — deadline has passed AND at least one tier is still unclaimed

export function deriveBountyStatus(
  tiers: PrizeTier[],
  deadline: BN
): BountyStatus {
  const nowSec     = Math.floor(Date.now() / 1000);
  const deadlineSec = deadline.toNumber();
  const allClaimed  = tiers.every((t) => t.claimed);

  if (allClaimed) return "claimed";
  if (nowSec > deadlineSec) return "expired";
  return "active";
}

// SOL formatting
//
// Converts lamports (BN or number) to a human-readable SOL string.
// Examples: 50000000000 → "50 SOL", 12500000000 → "12.5 SOL"

const LAMPORTS = 1_000_000_000;

export function formatSol(lamports: BN | number): string {
  const raw  = typeof lamports === "number" ? lamports : lamports.toNumber();
  const sol  = raw / LAMPORTS;
  // Show decimals only when needed
  const display = sol % 1 === 0 ? sol.toFixed(0) : sol.toFixed(2).replace(/\.?0+$/, "");
  return `${display} SOL`;
}

export function totalLocked(tiers: PrizeTier[]): BN {
  return tiers.reduce((acc, t) => acc.add(t.amount), new BN(0));
}

export function unclaimedTotal(tiers: PrizeTier[]): BN {
  return tiers
    .filter((t) => !t.claimed)
    .reduce((acc, t) => acc.add(t.amount), new BN(0));
}

// Deadline formatting
//
// Returns a short human-readable string relative to now.
// Examples:
//   "28 days left"
//   "3 hours left"
//   "Expired 2 days ago"
//   "Expired just now"

export function formatDeadline(deadline: BN): string {
  const nowMs      = Date.now();
  const deadlineMs = deadline.toNumber() * 1000;
  const diffMs     = deadlineMs - nowMs;
  const diffSec    = Math.floor(Math.abs(diffMs) / 1000);

  const minutes = Math.floor(diffSec / 60);
  const hours   = Math.floor(diffSec / 3600);
  const days    = Math.floor(diffSec / 86400);

  if (diffMs > 0) {
    // Future
    if (days > 0)    return `${days} day${days === 1 ? "" : "s"} left`;
    if (hours > 0)   return `${hours} hour${hours === 1 ? "" : "s"} left`;
    if (minutes > 0) return `${minutes} min left`;
    return "Ending soon";
  } else {
    // Past
    if (days > 0)    return `Expired ${days} day${days === 1 ? "" : "s"} ago`;
    if (hours > 0)   return `Expired ${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (minutes > 0) return `Expired ${minutes} min ago`;
    return "Expired just now";
  }
}

// Address truncation (shared util used in cards)

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}