// Escrow data as the frontend uses it, decoded from the on-chain Escrow account.
// Matches onchain/programs/openbounty_v2/src/state/escrow.rs.

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { AssetId } from "@/constants/assets";
import type { ChainId } from "@/constants/chains";

// One judge's vote on a prize tier
export interface TierVote {
  judge: PublicKey;
  candidate: PublicKey;
}

// Where a claimed prize was sent (multichain preview only)
export interface Payout {
  chain: ChainId;
  address: string;
}

// One prize. `winner` is set once a candidate reaches the vote threshold.
export interface PrizeTier {
  amount: BN;               // base units of the bounty's asset (lamports for SOL)
  winner: PublicKey | null;
  claimed: boolean;
  votes: TierVote[];
  payout?: Payout;
}

export interface EscrowAccount {
  publicKey: PublicKey;     // the escrow account address, used in /bounty/[address]
  title: string;
  metadataUri: string;
  organizer: PublicKey;
  asset: AssetId;           // what the prizes are paid in; always "SOL" on-chain today
  nonce: number;            // lets one organizer run many bounties
  judges: PublicKey[];
  threshold: number;        // votes needed to pick a winner
  tiers: PrizeTier[];
  deadline: BN;             // unix seconds
  bump: number;
  vaultBump: number;
}
