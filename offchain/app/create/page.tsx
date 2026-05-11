"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useEscrow } from "@/hooks/useEscrow";
import CreateBountyForm from "@/components/create/CreateBountyForm";

export default function CreateBountyPage() {
  const { publicKey, connected } = useWallet();

  const { escrow, loading } = useEscrow(
    connected && publicKey ? publicKey.toBase58() : null
  );

  return (
    <div style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "2.5rem 1.5rem 4rem",
    }}>
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

      {connected && loading && (
        <div style={{
          color: "var(--offwhite-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
        }}>
          Checking wallet...
        </div>
      )}

      {/* Already has an escrow — show message, don't redirect */}
      {connected && !loading && escrow && (
        <div style={{
          maxWidth: 620,
          background: "var(--brown-dark)",
          border: "1px solid var(--border-bright)",
          borderRadius: 10,
          padding: "2rem",
          boxShadow: "var(--shadow-ochre)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--ochre-dim)",
              border: "1px solid var(--border-bright)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--ochre-light)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.05rem",
                color: "var(--offwhite)",
                marginBottom: "0.2rem",
              }}>
                You already have a bounty
              </p>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                color: "var(--offwhite-muted)",
              }}>
                Each wallet can only manage one escrow at a time.
              </p>
            </div>
          </div>

          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--offwhite-muted)",
            lineHeight: 1.6,
          }}>
            Your current bounty{" "}
            <span style={{
              fontFamily: "var(--font-heading)",
              color: "var(--ochre-pale)",
            }}>
              {escrow.title}
            </span>{" "}
            is active. To create a new bounty, switch to a different wallet.
          </p>

          <Link
            href="/"
            style={{
              alignSelf: "flex-start",
              padding: "0.55rem 1.25rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "var(--ochre)",
              color: "var(--brown-deepest)",
              borderRadius: 5,
              textDecoration: "none",
              letterSpacing: "0.03em",
            }}
          >
            View Dashboard
          </Link>
        </div>
      )}

      {/* Form — no wallet or no existing escrow */}
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