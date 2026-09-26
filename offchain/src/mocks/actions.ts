// Mock versions of vote_winner, claim_prize and refund_unclaimed.
// They run the same checks as the program (instructions/*.rs) and throw the same
// "Error Code: X" messages, so the UI's error handling works in mock mode too.

import { PublicKey } from "@solana/web3.js";
import type { Payout } from "@/types/escrow";
import { addMockSubmission, findMockEscrow, getMockSubmissions, removeMockEscrow } from "./store";
import type { Submission } from "@/types/submission";
import type { SubmissionValues } from "@/utils/submissions";

function fail(code: string): never {
  throw new Error(`Error Code: ${code}.`);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function getEscrow(address: PublicKey) {
  const escrow = findMockEscrow(address);
  if (!escrow) fail("AccountNotInitialized");
  return escrow;
}

export function mockVote(address: PublicKey, tierIndex: number, judge: PublicKey, candidate: PublicKey): void {
  const escrow = getEscrow(address);
  if (nowSeconds() > escrow.deadline.toNumber()) fail("EscrowExpired");
  if (!escrow.judges.some((j) => j.equals(judge))) fail("NotAJudge");

  const tier = escrow.tiers[tierIndex];
  if (!tier) fail("InvalidTier");
  if (tier.winner) fail("TierAlreadyFinalized");
  if (tier.votes.some((vote) => vote.judge.equals(judge))) fail("AlreadyVoted");

  tier.votes.push({ judge, candidate });

  // Auto-finalize once the candidate reaches the threshold
  const count = tier.votes.filter((vote) => vote.candidate.equals(candidate)).length;
  if (count >= escrow.threshold) tier.winner = candidate;
}

// `payout` is where the winner chose to receive it (multichain preview); default is their Solana wallet
export function mockClaim(address: PublicKey, tierIndex: number, claimer: PublicKey, payout?: Payout): void {
  const escrow = getEscrow(address);
  const tier = escrow.tiers[tierIndex];
  if (!tier) fail("InvalidTier");
  if (!tier.winner) fail("NotFinalized");
  if (tier.claimed) fail("TierAlreadyClaimed");
  if (!tier.winner.equals(claimer)) fail("Unauthorized");

  tier.claimed = true;
  tier.payout = payout ?? { chain: "solana", address: claimer.toBase58() };

  // The program closes the escrow once every tier is claimed
  if (escrow.tiers.every((t) => t.claimed)) removeMockEscrow(address);
}

export function mockRefund(address: PublicKey, organizer: PublicKey): void {
  const escrow = getEscrow(address);
  if (!escrow.organizer.equals(organizer)) fail("Unauthorized");
  if (nowSeconds() <= escrow.deadline.toNumber()) fail("DeadlineNotPassed");
  if (escrow.tiers.every((t) => t.claimed)) fail("NoUnclaimedFunds");

  // Refund pays out every unclaimed tier and closes the escrow
  removeMockEscrow(address);
}

// Mock of a future submit_entry instruction. Error codes are the ones proposed in
// docs/features/judging.md for that instruction.
export function mockSubmit(address: PublicKey, submitter: PublicKey, values: SubmissionValues): Submission {
  const escrow = getEscrow(address);
  if (nowSeconds() > escrow.deadline.toNumber()) fail("SubmissionsClosed");
  if (escrow.organizer.equals(submitter)) fail("OrganizerCannotSubmit");
  if (escrow.judges.some((judge) => judge.equals(submitter))) fail("JudgeCannotSubmit");
  if (getMockSubmissions(submitter, address).some((s) => s.submitter.equals(submitter))) fail("AlreadySubmitted");

  const submission: Submission = {
    id: `entry-${Date.now()}`,
    bounty: address,
    submitter,
    title: values.title.trim(),
    url: values.url.trim(),
    description: values.description.trim(),
    submittedAt: new Date(),
  };
  addMockSubmission(submission);
  return submission;
}
