"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useEscrow } from "@/hooks/useEscrow";
import { useProgram } from "@/hooks/useProgram";
import BountyCard from "@/components/dashboard/BountyCard";
import {
  deriveBountyStatus,
  formatSol,
  formatDeadline,
  totalLocked,
  BountyStatus,
} from "@/utils/bountyStatus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Filter = "all" | BountyStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All",     value: "all"     },
  { label: "Active",  value: "active"  },
  { label: "Claimed", value: "claimed" },
  { label: "Expired", value: "expired" },
];

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: "1 1 160px",
      background: "var(--brown-dark)",
      border: "1px solid var(--border-bright)",
      borderRadius: 8,
      padding: "1.1rem 1.35rem",
      boxShadow: "var(--shadow-ochre)",
    }}>
      <p style={{
        fontSize: "0.68rem",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--offwhite-muted)",
        marginBottom: "0.5rem",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-heading)",
        fontSize: "1.6rem",
        fontWeight: 700,
        color: "var(--ochre-pale)",
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disconnected hero
// ---------------------------------------------------------------------------

function DisconnectedHero({ onConnect }: { onConnect: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "5rem 1.5rem",
      gap: "1.25rem",
    }}>
      {/* Lock icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "var(--ochre-dim)",
        border: "1px solid var(--border-bright)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "0.5rem",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="var(--ochre-light)" strokeWidth="1.75">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <p style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.75rem",
        color: "var(--offwhite)",
        fontWeight: 400,
        lineHeight: 1.2,
      }}>
        Trustless bounties on Solana
      </p>

      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.9rem",
        color: "var(--offwhite-muted)",
        maxWidth: 420,
        lineHeight: 1.7,
      }}>
        Organizers lock funds upfront. Judges vote on winners. 
        Winners claim permissionlessly. No rugs.
      </p>

      <button
        onClick={onConnect}
        style={{
          marginTop: "0.5rem",
          padding: "0.7rem 2rem",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          fontWeight: 700,
          background: "var(--ochre)",
          color: "var(--brown-deepest)",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
          letterSpacing: "0.04em",
        }}
      >
        Connect Wallet
      </button>

      <p style={{
        fontSize: "0.75rem",
        fontFamily: "var(--font-body)",
        color: "var(--offwhite-muted)",
        opacity: 0.6,
      }}>
        Connect to view and create bounties on devnet
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [filter, setFilter] = useState<Filter>("all");

  const program = useProgram();

  // Only fetch when wallet is connected — avoids read-only provider failures
  const { escrows, loading, error } = useAllEscrows(
    connected ? program : null
  );

  const { escrow: ownEscrow } = useEscrow(
    connected && publicKey ? publicKey.toBase58() : null
  );

  const filtered = useMemo(() => {
    if (filter === "all") return escrows;
    return escrows.filter(
      (e) => deriveBountyStatus(e.tiers, e.deadline) === filter
    );
  }, [escrows, filter]);

  const ownTotal    = ownEscrow ? formatSol(totalLocked(ownEscrow.tiers)) : null;
  const ownTiers    = ownEscrow ? ownEscrow.tiers.length : null;
  const ownJudges   = ownEscrow ? ownEscrow.judges.length : null;
  const ownDeadline = ownEscrow ? formatDeadline(ownEscrow.deadline) : null;

  // ---------------------------------------------------------------------------
  // Disconnected — show hero instead of broken grid
  // ---------------------------------------------------------------------------
  if (!connected) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>
        <DisconnectedHero onConnect={() => setVisible(true)} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Connected
  // ---------------------------------------------------------------------------
  return (
    <div style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "2.5rem 1.5rem 4rem",
    }}>

      {/* Header row: title + filters */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          color: "var(--offwhite)",
          fontWeight: 400,
        }}>
          All Bounties
        </h1>

        <div style={{
          display: "flex",
          gap: "0.25rem",
          background: "var(--brown-dark)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "0.25rem",
        }}>
          {FILTERS.map(({ label, value }) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  background: isActive ? "var(--ochre-dim)" : "transparent",
                  color: isActive ? "var(--ochre-light)" : "var(--offwhite-muted)",
                  border: isActive ? "1px solid rgba(200,134,10,0.3)" : "1px solid transparent",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bounty grid */}
      {loading ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 0",
          color: "var(--offwhite-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
        }}>
          Loading bounties...
        </div>
      ) : error ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 0",
          color: "#D9644A",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
        }}>
          Failed to load bounties. Check your connection and try refreshing.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            color: "var(--offwhite-muted)",
            fontStyle: "italic",
          }}>
            {filter === "all" ? "No bounties on-chain yet" : `No ${filter} bounties`}
          </p>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--offwhite-muted)",
            opacity: 0.7,
          }}>
            {filter === "all" ? "Be the first — create a bounty." : "Check back later."}
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1rem",
        }}>
          {filtered.map((escrow) => {
            const isOwn =
              publicKey &&
              escrow.organizer.toBase58() === publicKey.toBase58();

            return (
              <BountyCard
                key={escrow.publicKey.toBase58()}
                escrow={escrow}
                isOwn={!!isOwn}
              />
            );
          })}
        </div>
      )}

      {/* Stats row — below grid, own escrow only */}
      {ownEscrow && (
        <section style={{ marginTop: "2.5rem" }}>
          <p style={{
            fontSize: "0.7rem",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--offwhite-muted)",
            marginBottom: "0.85rem",
          }}>
            Your Bounty Stats
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <StatCard label="Total Locked" value={ownTotal!} />
            <StatCard label="Prize Tiers"  value={String(ownTiers!)} />
            <StatCard label="Judges"       value={String(ownJudges!)} />
            <StatCard label="Deadline"     value={ownDeadline!} />
          </div>
        </section>
      )}

    </div>
  );
}