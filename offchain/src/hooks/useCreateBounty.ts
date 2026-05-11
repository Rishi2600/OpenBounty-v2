"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { deriveEscrowAccounts } from "@/utils/pda";

// ---------------------------------------------------------------------------
// Form values — what the Create Bounty form collects
// ---------------------------------------------------------------------------

export interface CreateBountyValues {
  title: string;
  metadataUri: string;
  judges: string[];         // pubkey strings, validated before submit
  threshold: number;
  tierAmounts: number[];    // in SOL, converted to lamports on submit
  deadlineDate: string;     // ISO date string from date input
}

// ---------------------------------------------------------------------------
// Validation — mirrors on-chain rules exactly
// ---------------------------------------------------------------------------

export interface ValidationErrors {
  title?: string;
  metadataUri?: string;
  judges?: string;
  threshold?: string;
  tierAmounts?: string;
  deadlineDate?: string;
}

export function validateForm(values: CreateBountyValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  } else if (values.title.length > 50) {
    errors.title = "Title must be 50 characters or less";
  }

  if (values.metadataUri.length > 100) {
    errors.metadataUri = "Metadata URI must be 100 characters or less";
  }

  if (values.judges.length === 0) {
    errors.judges = "At least one judge is required";
  } else if (values.judges.length > 5) {
    errors.judges = "Maximum 5 judges allowed";
  } else {
    for (const j of values.judges) {
      try {
        new PublicKey(j);
      } catch {
        errors.judges = `Invalid public key: ${j.slice(0, 8)}...`;
        break;
      }
    }
  }

  if (!values.threshold || values.threshold < 1) {
    errors.threshold = "Threshold must be at least 1";
  } else if (values.threshold > values.judges.length) {
    errors.threshold = `Threshold cannot exceed judge count (${values.judges.length})`;
  }

  if (values.tierAmounts.length === 0) {
    errors.tierAmounts = "At least one prize tier is required";
  } else if (values.tierAmounts.length > 4) {
    errors.tierAmounts = "Maximum 4 prize tiers allowed";
  } else {
    for (const amt of values.tierAmounts) {
      if (!amt || amt <= 0) {
        errors.tierAmounts = "All tier amounts must be greater than 0";
        break;
      }
    }
  }

  if (!values.deadlineDate) {
    errors.deadlineDate = "Deadline is required";
  } else {
    const deadlineTs = Math.floor(new Date(values.deadlineDate).getTime() / 1000);
    const nowTs      = Math.floor(Date.now() / 1000);
    if (deadlineTs <= nowTs) {
      errors.deadlineDate = "Deadline must be in the future";
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseCreateBountyResult {
  submit: (values: CreateBountyValues) => Promise<void>;
  loading: boolean;
  error: string | null;
  txSignature: string | null;
  reset: () => void;
}

export function useCreateBounty(): UseCreateBountyResult {
  const program   = useProgram();
  const { publicKey } = useWallet();
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setTxSignature(null);
  }, []);

  const submit = useCallback(async (values: CreateBountyValues) => {
    if (!program || !publicKey) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      const { escrow, vault } = deriveEscrowAccounts(publicKey);

      const judges      = values.judges.map((j) => new PublicKey(j));
      const tierAmounts = values.tierAmounts.map(
        (amt) => new BN(Math.round(amt * LAMPORTS_PER_SOL))
      );
      const deadline    = new BN(
        Math.floor(new Date(values.deadlineDate).getTime() / 1000)
      );

      const tx = await program.methods
        .initializeEscrow(
          values.title.trim(),
          values.metadataUri.trim(),
          judges,
          values.threshold,
          tierAmounts,
          deadline,
        )
        .accountsPartial({
          escrow,
          vault,
          organizer:     publicKey,
          systemProgram: new PublicKey("11111111111111111111111111111111"),
        })
        .rpc();

      setTxSignature(tx);
    } catch (err: any) {
      // Surface the most useful part of Anchor errors
      const msg: string = err?.message ?? "Transaction failed";
      if (msg.includes("already in use")) {
        setError("You already have an escrow. Only one bounty per wallet is allowed.");
      } else if (msg.includes("InvalidTitle")) {
        setError("Title is invalid — must be 1–50 characters.");
      } else if (msg.includes("InvalidMetadataUri")) {
        setError("Metadata URI is too long — max 100 characters.");
      } else if (msg.includes("InvalidThreshold")) {
        setError("Threshold exceeds the number of judges.");
      } else if (msg.includes("InvalidDeadline")) {
        setError("Deadline must be in the future.");
      } else if (msg.includes("NoJudges")) {
        setError("At least one judge is required.");
      } else if (msg.includes("NoTiers")) {
        setError("At least one prize tier is required.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  return { submit, loading, error, txSignature, reset };
}