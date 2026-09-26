// A builder's entry to a bounty. The submitter's wallet is the candidate judges vote for,
// so entries work with the existing vote_winner instruction.

import { PublicKey } from "@solana/web3.js";

export interface Submission {
  id: string;
  bounty: PublicKey;      // escrow address
  submitter: PublicKey;   // builder's wallet, also the address judges vote for
  title: string;          // project name
  url: string;            // demo or repo link
  description: string;
  submittedAt: Date;
}
