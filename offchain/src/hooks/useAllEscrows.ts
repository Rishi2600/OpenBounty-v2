"use client";

import { useEffect, useState, useCallback } from "react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "@/types/onchain/openbounty_v2";
import IDL from "@/idl/openbounty_v2.json";
import { devnetConnection } from "@/utils/anchor-setup";
import { PROGRAM_ID } from "@/constants/program";

export interface PrizeTier {
  amount: BN;
  winner: PublicKey | null;
  claimed: boolean;
}

export interface EscrowAccount {
  publicKey: PublicKey;
  title: string;
  metadataUri: string;
  organizer: PublicKey;
  judges: PublicKey[];
  threshold: number;
  tiers: PrizeTier[];
  deadline: BN;
  bump: number;
  vaultBump: number;
}

interface UseAllEscrowsResult {
  escrows: EscrowAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Build a read-only program instance that works without a wallet
function getReadOnlyProgram(): Program<OpenbountyV2> {
//   const dummyKeypair = Keypair.generate();
  const provider = new AnchorProvider(
    devnetConnection,
    // Dummy wallet — read-only, never signs
    {
      publicKey: new PublicKey("D6TRWQntWAJVZJXU7ceY98Nka98XRWKbPLU5sKRghZY2"),
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  return new Program<OpenbountyV2>(IDL as any, provider);
}

export function useAllEscrows(): UseAllEscrowsResult {
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [tick, setTick]     = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const program = getReadOnlyProgram();
        const raw = await program.account.escrow.all();

        if (cancelled) return;

        const parsed: EscrowAccount[] = raw.map((item) => ({
          publicKey:   item.publicKey,
          title:       item.account.title,
          metadataUri: item.account.metadataUri,
          organizer:   item.account.organizer,
          judges:      item.account.judges,
          threshold:   item.account.threshold,
          tiers:       item.account.tiers as PrizeTier[],
          deadline:    item.account.deadline,
          bump:        item.account.bump,
          vaultBump:   item.account.vaultBump,
        }));

        setEscrows(parsed);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to fetch escrows");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tick]);

  return { escrows, loading, error, refetch };
}