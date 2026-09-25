// Status names users see (see .claude/skills/openbounty-ui/SKILL.md, "Status names").

import { BN } from "@coral-xyz/anchor";
import type { PrizeTier, TierVote } from "@/types/escrow";

// Bounty: Open -> Ending soon (last 24h) -> Ended.
// There is no "claimed" bounty: the program closes it once every tier is claimed.
export type BountyStatus = "open" | "ending-soon" | "ended";

const ENDING_SOON_SECONDS = 24 * 60 * 60;

export function getBountyStatus(deadline: BN): BountyStatus {
  const secondsLeft = deadline.toNumber() - Math.floor(Date.now() / 1000);
  if (secondsLeft <= 0) return "ended";
  if (secondsLeft < ENDING_SOON_SECONDS) return "ending-soon";
  return "open";
}

// Tier: Awaiting votes -> Voting (x of threshold) -> Winner picked -> Claimed
export type TierStatus = "awaiting" | "voting" | "winner" | "claimed";

export interface TierProgress {
  status: TierStatus;
  leadingVotes: number; // votes of the candidate with the most votes
}

export function getTierProgress(tier: PrizeTier): TierProgress {
  const leadingVotes = countLeadingVotes(tier.votes);

  if (tier.claimed) return { status: "claimed", leadingVotes };
  if (tier.winner) return { status: "winner", leadingVotes };
  if (tier.votes.length === 0) return { status: "awaiting", leadingVotes };
  return { status: "voting", leadingVotes };
}

// How many tiers already have a winner (claimed or not)
export function countDecidedTiers(tiers: PrizeTier[]): number {
  return tiers.filter((tier) => tier.winner !== null).length;
}

function countLeadingVotes(votes: TierVote[]): number {
  const counts = new Map<string, number>();
  for (const vote of votes) {
    const key = vote.candidate.toBase58();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let most = 0;
  for (const count of counts.values()) {
    if (count > most) most = count;
  }
  return most;
}
