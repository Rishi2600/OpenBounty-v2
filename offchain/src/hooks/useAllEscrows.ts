"use client";

// Every escrow on-chain (or the mock samples in mock mode), with loading/error state.

import { useEffect, useState, useCallback } from "react";
import { Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "@/types/onchain/openbounty_v2";
import { getReadOnlyProgram, toEscrowAccount } from "@/utils/anchor-setup";
import { ESCROW_ACCOUNT_SIZE } from "@/constants/program";
import type { EscrowAccount } from "@/types/escrow";
import { USE_MOCKS, getMockEscrows, mockDelay } from "@/mocks/store";

interface UseAllEscrowsResult {
  escrows: EscrowAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAllEscrows(
  connectedProgram?: Program<OpenbountyV2> | null
): UseAllEscrowsResult {
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCKS) {
          await mockDelay();
          if (cancelled) return;
          const viewer = connectedProgram?.provider.publicKey ?? null;
          setEscrows(getMockEscrows(viewer));
          return;
        }

        const program = connectedProgram ?? getReadOnlyProgram();
        // dataSize filter skips old v1 escrows, which would fail to decode
        const raw = await program.account.escrow.all([
          { dataSize: ESCROW_ACCOUNT_SIZE },
        ]);

        if (cancelled) return;

        setEscrows(raw.map((item) => toEscrowAccount(item.publicKey, item.account)));
        setError(null);
      } catch (err) {
        console.error("useAllEscrows full error:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch escrows");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [connectedProgram, tick]);

  return { escrows, loading, error, refetch };
}