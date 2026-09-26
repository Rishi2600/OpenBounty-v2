"use client";

// Create-bounty logic: form values, validation that mirrors the program's checks,
// and the initialize_escrow transaction (or a mock one in mock mode).

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { deriveEscrowAccounts } from "@/utils/pda";
import { parseAddress } from "@/utils/address";
import { findNextNonce } from "@/utils/anchor-setup";
import {
  MAX_JUDGES,
  MAX_METADATA_URI_BYTES,
  MAX_TIERS,
  MAX_TITLE_BYTES,
} from "@/constants/program";
import { USE_MOCKS, addMockEscrow, mockDelay, mockSignature } from "@/mocks/store";

export interface CreateBountyValues {
  title: string;
  metadataUri: string;
  judges: string[];       // filled-in addresses only
  threshold: number;
  tierAmounts: string[];  // SOL amounts as typed, filled-in only
  deadline: string;       // value of a datetime-local input
}

export type ValidationErrors = Partial<Record<keyof CreateBountyValues, string>>;

export interface CreatedBounty {
  signature: string;
  address: string;        // new escrow account
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// The program measures strings in bytes, so emoji and accents count for more
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function toLamports(sol: string): BN {
  return new BN(Math.round(Number(sol) * LAMPORTS_PER_SOL));
}

function validateJudges(judges: string[]): string | undefined {
  if (judges.length === 0) return "Add at least one judge.";
  if (judges.length > MAX_JUDGES) return `You can add up to ${MAX_JUDGES} judges.`;

  const invalid = judges.find((judge) => parseAddress(judge) === null);
  if (invalid) return `"${invalid.slice(0, 8)}..." isn't a valid wallet address.`;

  // A repeated judge can only vote once, which can make the threshold impossible
  const unique = new Set(judges.map((judge) => judge.trim()));
  if (unique.size !== judges.length) return "Each judge can only be added once.";

  return undefined;
}

function validateThreshold(threshold: number, judgeCount: number): string | undefined {
  if (judgeCount === 0) return undefined; // the judges error already covers this
  if (!Number.isInteger(threshold) || threshold < 1) return "At least 1 vote is needed.";
  if (threshold > judgeCount) return `Can't be more than the number of judges (${judgeCount}).`;
  return undefined;
}

function validateAmounts(amounts: string[]): string | undefined {
  if (amounts.length === 0) return "Add at least one prize.";
  if (amounts.length > MAX_TIERS) return `You can add up to ${MAX_TIERS} prizes.`;
  const tooSmall = amounts.some((amount) => toLamports(amount).lte(new BN(0)));
  if (tooSmall) return "Every prize needs an amount above 0 SOL.";
  return undefined;
}

function validateDeadline(deadline: string): string | undefined {
  if (!deadline) return "Pick a deadline.";
  const time = new Date(deadline).getTime();
  if (Number.isNaN(time)) return "That date isn't valid.";
  if (time <= Date.now()) return "The deadline must be in the future.";
  return undefined;
}

export function validateForm(values: CreateBountyValues): ValidationErrors {
  const errors: ValidationErrors = {};

  const title = values.title.trim();
  if (!title) errors.title = "Give the bounty a title.";
  else if (byteLength(title) > MAX_TITLE_BYTES) errors.title = `Keep the title under ${MAX_TITLE_BYTES} characters.`;

  if (byteLength(values.metadataUri.trim()) > MAX_METADATA_URI_BYTES) {
    errors.metadataUri = `Keep the link under ${MAX_METADATA_URI_BYTES} characters.`;
  }

  errors.judges = validateJudges(values.judges);
  errors.threshold = validateThreshold(values.threshold, values.judges.length);
  errors.tierAmounts = validateAmounts(values.tierAmounts);
  errors.deadline = validateDeadline(values.deadline);

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCreateBounty() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [submitting, setSubmitting] = useState(false);

  // Sends the transaction. Throws on failure; show errors with friendlyTxError().
  async function createBounty(values: CreateBountyValues): Promise<CreatedBounty> {
    if (!program || !publicKey) throw new Error("Connect a wallet first.");

    setSubmitting(true);
    try {
      const title = values.title.trim();
      const metadataUri = values.metadataUri.trim();
      const judges = values.judges.map((judge) => new PublicKey(judge.trim()));
      const tierAmounts = values.tierAmounts.map(toLamports);
      const deadline = new BN(Math.floor(new Date(values.deadline).getTime() / 1000));

      if (USE_MOCKS) {
        await mockDelay();
        const address = addMockEscrow({
          asset: "SOL",
          title, metadataUri, organizer: publicKey, judges,
          threshold: values.threshold, tierAmounts, deadline,
        });
        return { signature: mockSignature(), address: address.toBase58() };
      }

      const nonce = await findNextNonce(program.provider.connection, publicKey);
      const { escrow, vault } = deriveEscrowAccounts(publicKey, nonce);

      const signature = await program.methods
        .initializeEscrow(title, metadataUri, judges, values.threshold, tierAmounts, deadline, nonce)
        .accountsPartial({
          escrow,
          vault,
          organizer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { signature, address: escrow.toBase58() };
    } finally {
      setSubmitting(false);
    }
  }

  return { createBounty, submitting };
}
