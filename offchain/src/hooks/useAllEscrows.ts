"use client";

import { useEffect, useState, useCallback } from "react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { OpenbountyV2 } from "@/types/onchain/openbounty_v2";
import IDL from "@/idl/openbounty_v2.json";
import { devnetConnection } from "@/utils/anchor-setup";
import { ESCROW_ACCOUNT_SIZE } from "@/constants/program";
import type { EscrowAccount, PrizeTier } from "@/types/escrow";
import { USE_MOCKS, getMockEscrows, mockDelay } from "@/mocks/store";

interface UseAllEscrowsResult {
  escrows: EscrowAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function getReadOnlyProgram(): Program<OpenbountyV2> {
  const dummy = Keypair.generate();
  const provider = new AnchorProvider(
    devnetConnection,
    {
      publicKey: dummy.publicKey,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  return new Program<OpenbountyV2>(IDL as OpenbountyV2, provider);
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

        const parsed: EscrowAccount[] = raw
          .map((item) => ({
            publicKey:   item.publicKey,
            title:       item.account.title,
            metadataUri: item.account.metadataUri,
            organizer:   item.account.organizer,
            nonce:       item.account.nonce,
            judges:      item.account.judges,
            threshold:   item.account.threshold,
            tiers:       item.account.tiers as PrizeTier[],
            deadline:    item.account.deadline,
            bump:        item.account.bump,
            vaultBump:   item.account.vaultBump,
          }));

        setEscrows(parsed);
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