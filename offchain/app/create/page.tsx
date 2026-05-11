"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useEscrow } from "@/hooks/useEscrow";
import CreateBountyForm from "@/components/create/CreateBountyForm";

export default function CreateBountyPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();

  const { escrow, loading } = useEscrow(
    connected && publicKey ? publicKey.toBase58() : null
  );

  // If connected wallet already has an escrow, redirect to dashboard
  useEffect(() => {
    if (connected && !loading && escrow) {
      router.push("/");
    }
  }, [connected, loading, escrow, router]);

  return (
    <div style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "2.5rem 1.5rem 4rem",
    }}>

      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.9rem",
          fontWeight: 400,
          color: "var(--offwhite)",
          marginBottom: "0.4rem",
        }}>
          Create Bounty
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
          color: "var(--offwhite-muted)",
        }}>
          Lock funds in a trustless escrow. Winners are decided by your judges.
        </p>
      </div>

      {/* Existing escrow check */}
      {connected && loading && (
        <div style={{
          color: "var(--offwhite-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
        }}>
          Checking wallet...
        </div>
      )}

      {/* Form card — shown when not loading and no existing escrow */}
      {(!connected || (!loading && !escrow)) && (
        <div style={{
          maxWidth: 620,
          background: "var(--brown-dark)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "2rem",
          boxShadow: "var(--shadow-warm)",
        }}>
          <CreateBountyForm />
        </div>
      )}

    </div>
  );
}