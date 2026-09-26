// Sample entries for the mock bounties in fixtures.ts. Uses the same people
// (mockKey seeds) so the existing sample votes point at real-looking entries.
// Links use example.com, a domain reserved for examples.

import { PublicKey } from "@solana/web3.js";
import type { Submission } from "@/types/submission";
import { mockKey } from "./fixtures";

const HOUR = 60 * 60 * 1000;

interface SampleEntry {
  bountySeed: number;     // seed of the bounty in fixtures.ts
  submitter: PublicKey;
  title: string;
  description: string;
  hoursAgo: number;
}

export function buildMockSubmissions(viewer: PublicKey | null): Submission[] {
  const me    = viewer ?? mockKey(99);
  const alice = mockKey(10);
  const bob   = mockKey(11);
  const carol = mockKey(12);
  const dave  = mockKey(13);
  const erin  = mockKey(14);

  const entries: SampleEntry[] = [
    // Build a Solana Wallet Tracker (you organize)
    { bountySeed: 30, submitter: alice, hoursAgo: 20, title: "Pocketwatch", description: "Tracks balances, NFTs and staking across several wallets, with price alerts." },
    { bountySeed: 30, submitter: dave,  hoursAgo: 44, title: "SolLens", description: "A read-only portfolio view with transaction labels and CSV export." },
    { bountySeed: 30, submitter: erin,  hoursAgo: 70, title: "Walletbook", description: "Groups wallets into profiles and shows a weekly summary." },

    // Design System for a DeFi Dashboard (you judge; alice and bob already have votes)
    { bountySeed: 31, submitter: alice, hoursAgo: 30, title: "Ledgerline UI", description: "Accessible components for trading screens: order books, depth charts and position tables." },
    { bountySeed: 31, submitter: bob,   hoursAgo: 52, title: "Vaultkit", description: "Dark and light themes with tokens for risk states, built for lending dashboards." },
    { bountySeed: 31, submitter: carol, hoursAgo: 75, title: "Swapcraft", description: "A small, strict design system focused on swap and bridge flows." },
    { bountySeed: 31, submitter: dave,  hoursAgo: 90, title: "Graphite DS", description: "Data-dense components with keyboard-first navigation." },

    // Smart Contract Audit Challenge (your entry won 2nd prize)
    { bountySeed: 32, submitter: alice, hoursAgo: 120, title: "Reentrancy map", description: "Found and documented two critical issues with proof-of-concept tests." },
    { bountySeed: 32, submitter: me,    hoursAgo: 110, title: "Account checks review", description: "Your entry: a review of missing signer and owner checks, with fixes." },
    { bountySeed: 32, submitter: bob,   hoursAgo: 100, title: "Fuzzing report", description: "Property tests that surfaced an overflow in fee math." },

    // Anchor Tutorial Series (ended)
    { bountySeed: 33, submitter: carol, hoursAgo: 200, title: "Anchor from zero", description: "A six-part written series with runnable examples." },
    { bountySeed: 33, submitter: erin,  hoursAgo: 180, title: "PDA patterns", description: "Short videos on PDAs, seeds and account constraints." },

    // Community Meme Contest (open, you have no role, so you can enter)
    { bountySeed: 34, submitter: bob,   hoursAgo: 5, title: "Dog in a hard hat", description: "A builder-season meme, sticker pack included." },
    { bountySeed: 34, submitter: erin,  hoursAgo: 3, title: "Validator at 3am", description: "Four-panel comic about late-night upgrades." },

    // Hackathon: Best Mobile dApp (ended)
    { bountySeed: 35, submitter: bob,   hoursAgo: 260, title: "Tapstake", description: "One-tap staking from a mobile wallet, with push notifications." },
    { bountySeed: 35, submitter: carol, hoursAgo: 250, title: "SplitSol", description: "Split bills with friends and settle in USDC." },
    { bountySeed: 35, submitter: dave,  hoursAgo: 240, title: "QuestPass", description: "Location-based quests that mint on-chain badges." },
  ];

  const now = Date.now();
  return entries.map((entry, index) => ({
    id: `sample-entry-${index}`,
    bounty: mockKey(entry.bountySeed),
    submitter: entry.submitter,
    title: entry.title,
    url: `https://example.com/entries/${index}`,
    description: entry.description,
    submittedAt: new Date(now - entry.hoursAgo * HOUR),
  }));
}
