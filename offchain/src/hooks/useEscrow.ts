"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { PrizeTier } from "./useAllEscrows";
import { deriveEscrowPda } from "../utils/pda";
import { fetchEscrow } from "../utils/anchor-setup";
import { USE_MOCKS, getMockEscrows, mockDelay } from "@/mocks/store";

export interface EscrowAccount {
  title: string;
  metadataUri: string;
  organizer: PublicKey;
  nonce: number;
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

// An organizer can hold many escrows, so one is identified by (organizer, nonce)
export function useEscrow(
  organizerAddress: string | null,
  nonce: number | null
): UseEscrowResult {
  const program = useProgram();
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!program || !organizerAddress || nonce === null) {
      setEscrow(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const organizer = new PublicKey(organizerAddress);

        if (USE_MOCKS) {
          await mockDelay();
          const viewer = program.provider.publicKey ?? null;
          const match  = getMockEscrows(viewer).find(
            (e) => e.organizer.equals(organizer) && e.nonce === nonce
          );
          if (!cancelled) setEscrow(match ?? null);
          return;
        }

        const [escrowPda] = deriveEscrowPda(organizer, nonce);
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
  }, [program, organizerAddress, nonce, tick]);

  return { escrow, loading, error, refetch };
}