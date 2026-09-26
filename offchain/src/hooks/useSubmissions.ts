"use client";

// Entries for one bounty, with loading/error state, plus submitting a new entry.
// Mock mode only for now: in real mode the list is empty and submitting throws,
// because the program has no submit_entry instruction yet.

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import type { SubmissionValues } from "@/utils/submissions";
import { SUBMISSIONS_PREVIEW } from "@/constants/submissions";
import { getMockSubmissions, mockDelay, mockSignature } from "@/mocks/store";
import { mockSubmit } from "@/mocks/actions";

export function useSubmissions(escrow: EscrowAccount | null) {
  const { publicKey } = useWallet();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const address = escrow ? escrow.publicKey.toBase58() : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!address) return;
      if (!SUBMISSIONS_PREVIEW) {
        setSubmissions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await mockDelay(400);
        if (!cancelled) setSubmissions(getMockSubmissions(publicKey, new PublicKey(address)));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load entries");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [address, publicKey, tick]);

  // Returns a (mock) signature and throws on failure; show errors with friendlyTxError()
  async function submitEntry(values: SubmissionValues): Promise<string> {
    if (!publicKey || !escrow) throw new Error("Connect a wallet first.");
    if (!SUBMISSIONS_PREVIEW) throw new Error("Entries aren't supported on-chain yet.");

    setSubmitting(true);
    try {
      await mockDelay();
      mockSubmit(escrow.publicKey, publicKey, values);
      return mockSignature();
    } finally {
      setSubmitting(false);
    }
  }

  return { submissions, loading, error, refetch, submitEntry, submitting };
}
