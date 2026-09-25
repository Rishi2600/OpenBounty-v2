import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import type { EscrowAccount, PrizeTier, TierVote } from "@/hooks/useAllEscrows";

// Sample bounties for UI work. Each one covers a different state or role,
// so every screen can be checked without a deployed program.
// The connected wallet ("viewer") is placed into some of them.
//
// There is no "all tiers claimed" sample on purpose: the program closes
// the escrow once every tier is claimed, so that state never exists on-chain.

const DAY = 86_400;

// Stable fake address. Only used in memory, never touches the chain.
function mockKey(seed: number): PublicKey {
  return Keypair.fromSeed(new Uint8Array(32).fill(seed)).publicKey;
}

function sol(amount: number): BN {
  return new BN(amount * LAMPORTS_PER_SOL);
}

// Deadline as a unix timestamp, `days` from now (negative = in the past)
function inDays(days: number): BN {
  return new BN(Math.floor(Date.now() / 1000 + days * DAY));
}

function vote(judge: PublicKey, candidate: PublicKey): TierVote {
  return { judge, candidate };
}

function tier(
  amount: number,
  winner: PublicKey | null = null,
  claimed = false,
  votes: TierVote[] = []
): PrizeTier {
  return { amount: sol(amount), winner, claimed, votes };
}

interface MockInput {
  seed: number;
  nonce: number;
  title: string;
  organizer: PublicKey;
  judges: PublicKey[];
  threshold: number;
  deadline: BN;
  tiers: PrizeTier[];
}

function escrow(input: MockInput): EscrowAccount {
  return {
    publicKey:   mockKey(input.seed),
    title:       input.title,
    metadataUri: "",
    organizer:   input.organizer,
    nonce:       input.nonce,
    judges:      input.judges,
    threshold:   input.threshold,
    tiers:       input.tiers,
    deadline:    input.deadline,
    bump:        255,
    vaultBump:   255,
  };
}

export function buildMockEscrows(viewer: PublicKey | null): EscrowAccount[] {
  // Without a connected wallet, "me" is just another fake address
  const me = viewer ?? mockKey(99);

  const [j1, j2, j3, j4, j5] = [1, 2, 3, 4, 5].map(mockKey);
  const alice = mockKey(10);
  const bob   = mockKey(11);
  const carol = mockKey(12);
  const orgA  = mockKey(20);
  const orgB  = mockKey(21);

  return [
    // You are the organizer. Open, no votes yet.
    escrow({
      seed: 30, nonce: 0,
      title: "Build a Solana Wallet Tracker",
      organizer: me,
      judges: [j1, j2, j3], threshold: 2,
      deadline: inDays(14),
      tiers: [tier(5), tier(2.5), tier(1)],
    }),

    // You are a judge and haven't voted. Tier 1 is at 2 of 3 votes.
    escrow({
      seed: 31, nonce: 0,
      title: "Design System for a DeFi Dashboard",
      organizer: orgA,
      judges: [me, j1, j2, j3, j4], threshold: 3,
      deadline: inDays(6),
      tiers: [
        tier(8, null, false, [vote(j1, alice), vote(j2, alice)]),
        tier(3, null, false, [vote(j3, bob)]),
      ],
    }),

    // You won tier 2 and can claim. Tier 1 is already claimed.
    escrow({
      seed: 32, nonce: 0,
      title: "Smart Contract Audit Challenge",
      organizer: orgB,
      judges: [j1, j2, j3], threshold: 2,
      deadline: inDays(3),
      tiers: [
        tier(10, alice, true,  [vote(j1, alice), vote(j2, alice)]),
        tier(4,  me,    false, [vote(j1, me), vote(j3, me)]),
      ],
    }),

    // You are the organizer. Expired with an unclaimed tier, so refund is possible.
    escrow({
      seed: 33, nonce: 1,
      title: "Anchor Tutorial Series",
      organizer: me,
      judges: [j4, j5], threshold: 1,
      deadline: inDays(-5),
      tiers: [
        tier(2, carol, true, [vote(j4, carol)]),
        tier(1),
      ],
    }),

    // No role for you. Ends in about 2 hours.
    escrow({
      seed: 34, nonce: 1,
      title: "Community Meme Contest",
      organizer: orgA,
      judges: [j2], threshold: 1,
      deadline: inDays(0.08),
      tiers: [tier(0.5)],
    }),

    // No role for you. Expired; a winner was picked but never claimed.
    escrow({
      seed: 35, nonce: 0,
      title: "Hackathon: Best Mobile dApp",
      organizer: orgB,
      judges: [j1, j2, j3, j4, j5], threshold: 3,
      deadline: inDays(-2),
      tiers: [
        tier(20, bob, false, [vote(j1, bob), vote(j2, bob), vote(j5, bob)]),
        tier(10),
        tier(5),
      ],
    }),
  ];
}
