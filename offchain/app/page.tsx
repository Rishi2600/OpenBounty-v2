"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useEscrow } from "@/hooks/useEscrow";
import BountyCard from "@/components/dashboard/BountyCard";
import {
  deriveBountyStatus,
  formatSol,
  formatDeadline,
  totalLocked,
  BountyStatus,
} from "@/utils/bountyStatus";

// ---------------------------------------------------------------------------
// Filter tabs
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
// Dashboard page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { publicKey, connected } = useWallet();
  const [filter, setFilter] = useState<Filter>("all");

  // All escrows — always fetched, works without wallet
  const { escrows, loading, error } = useAllEscrows();

  // Connected wallet's own escrow — for the stats row
  const { escrow: ownEscrow } = useEscrow(
    connected && publicKey ? publicKey.toBase58() : null
  );

  // Filtered escrows
  const filtered = useMemo(() => {
    if (filter === "all") return escrows;
    return escrows.filter(
      (e) => deriveBountyStatus(e.tiers, e.deadline) === filter
    );
  }, [escrows, filter]);

  // Stats derived from own escrow
  const ownTotal    = ownEscrow ? formatSol(totalLocked(ownEscrow.tiers)) : null;
  const ownTiers    = ownEscrow ? ownEscrow.tiers.length : null;
  const ownJudges   = ownEscrow ? ownEscrow.judges.length : null;
  const ownDeadline = ownEscrow ? formatDeadline(ownEscrow.deadline) : null;

  return (
    <div style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "2.5rem 1.5rem 4rem",
    }}>

      {/* ------------------------------------------------------------------ */}
      {/* Stats row — only when connected + own escrow exists                 */}
      {/* ------------------------------------------------------------------ */}
      {connected && ownEscrow && (
        <section style={{ marginBottom: "2.5rem" }}>
          <p style={{
            fontSize: "0.7rem",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--offwhite-muted)",
            marginBottom: "0.85rem",
          }}>
            Your Bounty
          </p>
          <div style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}>
            <StatCard label="Total Locked" value={ownTotal!} />
            <StatCard label="Prize Tiers"  value={String(ownTiers!)} />
            <StatCard label="Judges"        value={String(ownJudges!)} />
            <StatCard label="Deadline"      value={ownDeadline!} />
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Bounty grid header: title + filter tabs                             */}
      {/* ------------------------------------------------------------------ */}
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

        {/* Filter tabs */}
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

      {/* ------------------------------------------------------------------ */}
      {/* Bounty grid                                                          */}
      {/* ------------------------------------------------------------------ */}
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
          Failed to load bounties. Check your connection.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 0",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            color: "var(--offwhite-muted)",
            fontStyle: "italic",
            marginBottom: "0.5rem",
          }}>
            No bounties found
          </p>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            color: "var(--offwhite-muted)",
            opacity: 0.7,
          }}>
            {filter === "all"
              ? "No escrows exist on-chain yet."
              : `No ${filter} bounties at the moment.`}
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
              connected &&
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

    </div>
  );
}