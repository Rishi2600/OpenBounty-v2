"use client";

// Vote, claim and refund transactions for one bounty (mock versions in mock mode).
// Each action returns the transaction signature and throws on failure;
// show errors with friendlyTxError(). `pending` says which action is running.

import { useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "./useProgram";
import type { EscrowAccount, Payout } from "@/types/escrow";
import { deriveVaultPda } from "@/utils/pda";
import { USE_MOCKS, mockDelay, mockSignature } from "@/mocks/store";
import { mockClaim, mockRefund, mockVote } from "@/mocks/actions";

// e.g. "vote-0", "claim-1", "refund"
export type PendingAction = string | null;

export function useBountyActions(escrow: EscrowAccount | null) {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [pending, setPending] = useState<PendingAction>(null);

  function requireReady() {
    if (!program || !publicKey || !escrow) throw new Error("Connect a wallet first.");
    const vault = deriveVaultPda(escrow.organizer, escrow.nonce)[0];
    return { program, wallet: publicKey, escrow, vault };
  }

  // Judge votes for `candidate` on one tier. The program picks the winner
  // automatically once a candidate reaches the threshold.
  async function vote(tierIndex: number, candidate: PublicKey): Promise<string> {
    const { program, wallet, escrow } = requireReady();
    setPending(`vote-${tierIndex}`);
    try {
      if (USE_MOCKS) {
        await mockDelay();
        mockVote(escrow.publicKey, tierIndex, wallet, candidate);
        return mockSignature();
      }
      return await program.methods
        .voteWinner(escrow.nonce, tierIndex, candidate)
        .accountsPartial({ escrow: escrow.publicKey, judge: wallet })
        .rpc();
    } finally {
      setPending(null);
    }
  }

  // Winner withdraws their prize. Claiming the last tier closes the bounty.
  // `payout` (multichain preview) is where to receive it; the deployed program always
  // pays the winner's Solana wallet, so real mode ignores it.
  async function claim(tierIndex: number, payout?: Payout): Promise<string> {
    const { program, wallet, escrow, vault } = requireReady();
    setPending(`claim-${tierIndex}`);
    try {
      if (USE_MOCKS) {
        await mockDelay();
        mockClaim(escrow.publicKey, tierIndex, wallet, payout);
        return mockSignature();
      }
      return await program.methods
        .claimPrize(escrow.nonce, tierIndex)
        .accountsPartial({
          escrow: escrow.publicKey,
          vault,
          winner: wallet,
          organizer: escrow.organizer,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } finally {
      setPending(null);
    }
  }

  // Organizer takes back every unclaimed prize after the deadline. Closes the bounty.
  async function refund(): Promise<string> {
    const { program, wallet, escrow, vault } = requireReady();
    setPending("refund");
    try {
      if (USE_MOCKS) {
        await mockDelay();
        mockRefund(escrow.publicKey, wallet);
        return mockSignature();
      }
      return await program.methods
        .refundUnclaimed(escrow.nonce)
        .accountsPartial({
          escrow: escrow.publicKey,
          vault,
          organizer: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } finally {
      setPending(null);
    }
  }

  return { vote, claim, refund, pending };
}
