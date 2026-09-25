"use client";

// One escrow by its account address (the /bounty/[address] page), with loading/error state.
// `escrow` is null when the address is invalid or the account doesn't exist, e.g.
// because the bounty was closed after every prize was claimed or refunded.

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { getReadOnlyProgram, toEscrowAccount } from "@/utils/anchor-setup";
import type { EscrowAccount } from "@/types/escrow";
import { USE_MOCKS, getMockEscrowCopy, mockDelay } from "@/mocks/store";

function parseAddress(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

export function useEscrow(address: string) {
  const program = useProgram();
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const key = parseAddress(address);
        let found: EscrowAccount | null = null;

        if (key && USE_MOCKS) {
          await mockDelay();
          const viewer = program?.provider.publicKey ?? null;
          found = getMockEscrowCopy(viewer, key);
        } else if (key) {
          const client = program ?? getReadOnlyProgram();
          const raw = await client.account.escrow.fetchNullable(key);
          found = raw ? toEscrowAccount(key, raw) : null;
        }

        if (!cancelled) setEscrow(found);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to fetch escrow");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [program, address, tick]);

  return { escrow, loading, error, refetch };
}
