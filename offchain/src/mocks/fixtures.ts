import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import type { EscrowAccount, Payout, TierVote } from "@/types/escrow";
import type { AssetId } from "@/constants/assets";
import { toBaseUnits } from "@/utils/format";

// Sample bounties for UI work. Each one covers a different state or role,
// so every screen can be checked without a deployed program.
// The connected wallet ("viewer") is placed into some of them.
//
// There is no "all tiers claimed" sample on purpose: the program closes
// the escrow once every tier is claimed, so that state never exists on-chain.
//
// Prizes use a mix of assets (SOL, USDC, USDT, BONK) for the multi-asset preview.

const DAY = 86_400;

// Stable fake address. Only used in memory, never touches the chain.
function mockKey(seed: number): PublicKey {
  return Keypair.fromSeed(new Uint8Array(32).fill(seed)).publicKey;
}

// Deadline as a unix timestamp, `days` from now (negative = in the past)
function inDays(days: number): BN {
  return new BN(Math.floor(Date.now() / 1000 + days * DAY));
}

function vote(judge: PublicKey, candidate: PublicKey): TierVote {
  return { judge, candidate };
}

// A tier with its amount in whole units (2500 = 2,500 USDC); escrow() converts it
interface MockTier {
  amount: number;
  winner: PublicKey | null;
  claimed: boolean;
  votes: TierVote[];
  payout?: Payout;
}

function tier(
  amount: number,
  winner: PublicKey | null = null,
  claimed = false,
  votes: TierVote[] = [],
  payout?: Payout
): MockTier {
  return { amount, winner, claimed, votes, payout };
}

interface MockInput {
  seed: number;
  nonce: number;
  asset: AssetId;
  title: string;
  organizer: PublicKey;
  judges: PublicKey[];
  threshold: number;
  deadline: BN;
  tiers: MockTier[];
}

function escrow(input: MockInput): EscrowAccount {
  return {
    publicKey:   mockKey(input.seed),
    title:       input.title,
    metadataUri: "",
    organizer:   input.organizer,
    asset:       input.asset,
    nonce:       input.nonce,
    judges:      input.judges,
    threshold:   input.threshold,
    tiers:       input.tiers.map((t) => ({ ...t, amount: toBaseUnits(String(t.amount), input.asset) })),
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
      seed: 30, nonce: 0, asset: "SOL",
      title: "Build a Solana Wallet Tracker",
      organizer: me,
      judges: [j1, j2, j3], threshold: 2,
      deadline: inDays(14),
      tiers: [tier(5), tier(2.5), tier(1)],
    }),

    // You are a judge and haven't voted. Tier 1 is at 2 of 3 votes. Paid in USDC.
    escrow({
      seed: 31, nonce: 0, asset: "USDC",
      title: "Design System for a DeFi Dashboard",
      organizer: orgA,
      judges: [me, j1, j2, j3, j4], threshold: 3,
      deadline: inDays(6),
      tiers: [
        tier(2500, null, false, [vote(j1, alice), vote(j2, alice)]),
        tier(1000, null, false, [vote(j3, bob)]),
      ],
    }),

    // You won tier 2 and can claim (USDC, so you can pick the payout chain).
    // Tier 1 was already claimed and paid out on Base.
    escrow({
      seed: 32, nonce: 0, asset: "USDC",
      title: "Smart Contract Audit Challenge",
      organizer: orgB,
      judges: [j1, j2, j3], threshold: 2,
      deadline: inDays(3),
      tiers: [
        tier(10000, alice, true, [vote(j1, alice), vote(j2, alice)], {
          chain: "base",
          address: "0x4F8a2c1bE3d97A60c5f1e82D3b9a07C6E5d21F3a",
        }),
        tier(4000, me, false, [vote(j1, me), vote(j3, me)]),
      ],
    }),

    // You are the organizer. Expired with an unclaimed tier, so refund is possible.
    escrow({
      seed: 33, nonce: 1, asset: "SOL",
      title: "Anchor Tutorial Series",
      organizer: me,
      judges: [j4, j5], threshold: 1,
      deadline: inDays(-5),
      tiers: [
        tier(2, carol, true, [vote(j4, carol)]),
        tier(1),
      ],
    }),

    // No role for you. Ends in about 2 hours. Paid in an ecosystem token.
    escrow({
      seed: 34, nonce: 1, asset: "BONK",
      title: "Community Meme Contest",
      organizer: orgA,
      judges: [j2], threshold: 1,
      deadline: inDays(0.08),
      tiers: [tier(5000000)],
    }),

    // No role for you. Expired; a winner was picked but never claimed. Paid in USDT.
    escrow({
      seed: 35, nonce: 0, asset: "USDT",
      title: "Hackathon: Best Mobile dApp",
      organizer: orgB,
      judges: [j1, j2, j3, j4, j5], threshold: 3,
      deadline: inDays(-2),
      tiers: [
        tier(20000, bob, false, [vote(j1, bob), vote(j2, bob), vote(j5, bob)]),
        tier(10000),
        tier(5000),
      ],
    }),
  ];
}
