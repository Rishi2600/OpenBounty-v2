// Escrow data as the frontend uses it, decoded from the on-chain Escrow account.
// Matches onchain/programs/openbounty_v2/src/state/escrow.rs.

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// One judge's vote on a prize tier
export interface TierVote {
  judge: PublicKey;
  candidate: PublicKey;
}

// One prize. `winner` is set once a candidate reaches the vote threshold.
export interface PrizeTier {
  amount: BN;               // lamports
  winner: PublicKey | null;
  claimed: boolean;
  votes: TierVote[];
}

export interface EscrowAccount {
  publicKey: PublicKey;     // the escrow account address, used in /bounty/[address]
  title: string;
  metadataUri: string;
  organizer: PublicKey;
  nonce: number;            // lets one organizer run many bounties
  judges: PublicKey[];
  threshold: number;        // votes needed to pick a winner
  tiers: PrizeTier[];
  deadline: BN;             // unix seconds
  bump: number;
  vaultBump: number;
}
