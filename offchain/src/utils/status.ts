// Status names users see (see .claude/skills/openbounty-ui/SKILL.md, "Status names").

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { PrizeTier } from "@/types/escrow";

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
  const tallies = getCandidateTallies(tier);
  const leadingVotes = tallies.length > 0 ? tallies[0].votes : 0;

  if (tier.claimed) return { status: "claimed", leadingVotes };
  if (tier.winner) return { status: "winner", leadingVotes };
  if (tier.votes.length === 0) return { status: "awaiting", leadingVotes };
  return { status: "voting", leadingVotes };
}

// How many tiers already have a winner (claimed or not)
export function countDecidedTiers(tiers: PrizeTier[]): number {
  return tiers.filter((tier) => tier.winner !== null).length;
}

// Votes per candidate on one tier, most votes first
export interface CandidateTally {
  candidate: PublicKey;
  votes: number;
}

export function getCandidateTallies(tier: PrizeTier): CandidateTally[] {
  const tallies: CandidateTally[] = [];
  for (const vote of tier.votes) {
    const existing = tallies.find((tally) => tally.candidate.equals(vote.candidate));
    if (existing) existing.votes += 1;
    else tallies.push({ candidate: vote.candidate, votes: 1 });
  }
  return tallies.sort((a, b) => b.votes - a.votes);
}
