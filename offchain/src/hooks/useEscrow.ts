"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { deriveEscrowPda } from "../utils/pda";
import { fetchEscrow } from "../utils/anchor-setup";

export interface PrizeTier {
  amount: BN;
  winner: PublicKey | null;
  claimed: boolean;
}

export interface EscrowAccount {
  organizer: PublicKey;
  judges: PublicKey[];
  threshold: number;
  tiers: PrizeTier[];
  deadline: BN;
  bump: number;
  vaultBump: number;
}

interface UseEscrowResult {
  escrow: EscrowAccount | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEscrow(organizerAddress: string | null): UseEscrowResult {
  const program = useProgram();
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!program || !organizerAddress) {
      setEscrow(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const organizer = new PublicKey(organizerAddress);
        const [escrowPda] = deriveEscrowPda(organizer);
        const account = await fetchEscrow(program, escrowPda);

        if (!cancelled) {
          setEscrow(account as EscrowAccount | null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to fetch escrow");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [program, organizerAddress, tick]);

  return { escrow, loading, error, refetch };
}