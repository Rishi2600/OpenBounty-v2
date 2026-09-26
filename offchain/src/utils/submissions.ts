// Rules and helpers for bounty entries: who may submit, validation, and how the
// on-chain votes (which point at wallet addresses) map onto entries.

import { PublicKey } from "@solana/web3.js";
import type { EscrowAccount, PrizeTier } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { MAX_SUBMISSION_DESCRIPTION, MAX_SUBMISSION_TITLE } from "@/constants/submissions";
import { getBountyStatus, getCandidateTallies } from "./status";
import { truncateAddress } from "./format";
import { safeDetailsUrl } from "./address";

// Why a wallet can't submit an entry right now (null = it can)
export type SubmitBlock = "not-connected" | "ended" | "organizer" | "judge" | "already-submitted";

export const SUBMIT_BLOCK_TEXT: Record<SubmitBlock, string> = {
  "not-connected": "Connect your wallet to submit an entry.",
  "ended": "This bounty has ended, so entries are closed.",
  "organizer": "Organizers can't enter their own bounty.",
  "judge": "Judges can't enter a bounty they judge.",
  "already-submitted": "You've already submitted an entry.",
};

export function getSubmitBlock(
  escrow: EscrowAccount,
  viewer: PublicKey | null,
  submissions: Submission[]
): SubmitBlock | null {
  if (!viewer) return "not-connected";
  if (getBountyStatus(escrow.deadline) === "ended") return "ended";
  if (escrow.organizer.equals(viewer)) return "organizer";
  if (escrow.judges.some((judge) => judge.equals(viewer))) return "judge";
  if (submissions.some((s) => s.submitter.equals(viewer))) return "already-submitted";
  return null;
}

// The entry behind a vote candidate, if that wallet submitted one
export function findSubmission(submissions: Submission[], candidate: PublicKey): Submission | undefined {
  return submissions.find((s) => s.submitter.equals(candidate));
}

// Votes an entry has on each tier: [2, 0] = 2 votes for 1st prize, none for 2nd
export function votesPerTier(escrow: EscrowAccount, submitter: PublicKey): number[] {
  return escrow.tiers.map(
    (tier) => tier.votes.filter((vote) => vote.candidate.equals(submitter)).length
  );
}

// Tier indexes this entry won
export function wonTiers(escrow: EscrowAccount, submitter: PublicKey): number[] {
  const won: number[] = [];
  escrow.tiers.forEach((tier, index) => {
    if (tier.winner && tier.winner.equals(submitter)) won.push(index);
  });
  return won;
}

// Who a judge can vote for on one tier: every entry (named by its title), plus any
// wallet that already has votes without an entry. Most votes first.
export interface VoteCandidate {
  address: PublicKey;
  label: string;
  votes: number;
}

export function getVoteCandidates(tier: PrizeTier, submissions: Submission[]): VoteCandidate[] {
  const candidates: VoteCandidate[] = submissions.map((s) => ({
    address: s.submitter,
    label: s.title,
    votes: tier.votes.filter((vote) => vote.candidate.equals(s.submitter)).length,
  }));

  for (const tally of getCandidateTallies(tier)) {
    const known = candidates.some((c) => c.address.equals(tally.candidate));
    if (!known) {
      candidates.push({ address: tally.candidate, label: truncateAddress(tally.candidate.toBase58()), votes: tally.votes });
    }
  }
  return candidates.sort((a, b) => b.votes - a.votes);
}

export interface SubmissionValues {
  title: string;
  url: string;
  description: string;
}

export type SubmissionErrors = Partial<Record<keyof SubmissionValues, string>>;

export function validateSubmission(values: SubmissionValues): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = "Give your entry a name.";
  else if (title.length > MAX_SUBMISSION_TITLE) errors.title = `Keep the name under ${MAX_SUBMISSION_TITLE} characters.`;

  if (!safeDetailsUrl(values.url)) errors.url = "Add a link starting with https:// (or ipfs://).";

  if (values.description.trim().length > MAX_SUBMISSION_DESCRIPTION) {
    errors.description = `Keep the description under ${MAX_SUBMISSION_DESCRIPTION} characters.`;
  }
  return errors;
}
