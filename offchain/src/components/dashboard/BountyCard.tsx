"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { EscrowAccount } from "@/hooks/useAllEscrows";
import {
  deriveBountyStatus,
  formatSol,
  formatDeadline,
  totalLocked,
  truncateAddress,
  BountyStatus,
} from "@/utils/bountyStatus";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: BountyStatus }) {
  const styles: Record<BountyStatus, { bg: string; color: string; label: string }> = {
    active:  { bg: "rgba(125, 154, 92, 0.15)",  color: "#9DBD72", label: "Active"   },
    claimed: { bg: "rgba(200, 134, 10, 0.15)",  color: "var(--ochre-light)", label: "Claimed"  },
    expired: { bg: "rgba(192, 57, 43, 0.15)",   color: "#D9644A", label: "Expired"  },
  };
  const s = styles[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "0.2rem 0.6rem",
      borderRadius: 4,
      fontSize: "0.7rem",
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// BountyCard
// ---------------------------------------------------------------------------

interface BountyCardProps {
  escrow: EscrowAccount;
  isOwn: boolean;
}

export default function BountyCard({ escrow, isOwn }: BountyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const status   = deriveBountyStatus(escrow.tiers, escrow.deadline);
  const total    = totalLocked(escrow.tiers);
  const deadline = formatDeadline(escrow.deadline);

  const handleClaim = (tierIndex: number) => {
    console.log("Claim prize — tier:", tierIndex, "escrow:", escrow.publicKey.toBase58());
  };

  const handleRefund = () => {
    console.log("Refund unclaimed — escrow:", escrow.publicKey.toBase58());
  };

  const canRefund =
    isOwn &&
    status === "expired" &&
    escrow.tiers.some((t) => !t.claimed);

  return (
    <div style={{
      background: isOwn
        ? "linear-gradient(135deg, var(--brown-dark) 0%, rgba(200,134,10,0.08) 100%)"
        : "var(--brown-dark)",
      border: isOwn
        ? "1px solid var(--border-bright)"
        : "1px solid var(--border)",
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: isOwn ? "var(--shadow-ochre)" : "var(--shadow-warm)",
      transition: "border-color 0.2s",
    }}>

      {/* ------------------------------------------------------------------ */}
      {/* Collapsed header — always visible, click to expand                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          padding: "1.25rem 1.5rem",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Top row: title + Your Bounty badge + chevron */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.85rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              color: "var(--offwhite)",
              lineHeight: 1.3,
            }}>
              {escrow.title}
            </span>
            {isOwn && (
              <span style={{
                fontSize: "0.65rem",
                padding: "0.15rem 0.45rem",
                background: "var(--ochre-dim)",
                color: "var(--ochre-light)",
                borderRadius: 3,
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: "1px solid rgba(200,134,10,0.3)",
                whiteSpace: "nowrap",
              }}>
                Your Bounty
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <StatusBadge status={status} />
            {/* Chevron */}
            <svg
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="var(--offwhite-muted)" strokeWidth="2"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Bottom row: total SOL + deadline + organizer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <span style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--ochre-pale)",
            lineHeight: 1,
          }}>
            {formatSol(total)}
          </span>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            flexWrap: "wrap",
          }}>
            {/* Deadline */}
            <span style={{
              fontSize: "0.78rem",
              color: status === "expired" ? "#D9644A" : "var(--offwhite-muted)",
              fontFamily: "var(--font-body)",
            }}>
              {deadline}
            </span>

            {/* Organizer */}
            <span style={{
              fontSize: "0.72rem",
              color: "var(--offwhite-muted)",
              fontFamily: "var(--font-mono)",
            }}>
              {truncateAddress(escrow.organizer.toBase58())}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Expanded body                                                        */}
      {/* ------------------------------------------------------------------ */}
      {expanded && (
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}>

          {/* Prize tiers */}
          <div>
            <p style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--offwhite-muted)",
              marginBottom: "0.6rem",
            }}>
              Prize Tiers
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {escrow.tiers.map((tier, i) => {
                const isWinner =
                  connected &&
                  publicKey &&
                  tier.winner &&
                  tier.winner.toBase58() === publicKey.toBase58();

                return (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.85rem",
                    background: "var(--offwhite-ghost)",
                    borderRadius: 6,
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}>
                    {/* Tier info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-body)",
                        fontWeight: 700,
                        color: "var(--offwhite-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        minWidth: "3rem",
                      }}>
                        Tier {i + 1}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--ochre-pale)",
                      }}>
                        {formatSol(tier.amount)}
                      </span>
                      {tier.winner ? (
                        <span style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono)",
                          color: "var(--offwhite-muted)",
                        }}>
                          → {truncateAddress(tier.winner.toBase58())}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-body)",
                          color: "var(--offwhite-muted)",
                          fontStyle: "italic",
                        }}>
                          No winner yet
                        </span>
                      )}
                    </div>

                    {/* Right side: claimed chip or claim button */}
                    <div>
                      {tier.claimed ? (
                        <span style={{
                          fontSize: "0.65rem",
                          padding: "0.15rem 0.45rem",
                          background: "rgba(125,154,92,0.15)",
                          color: "#9DBD72",
                          borderRadius: 3,
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}>
                          Claimed
                        </span>
                      ) : connected ? (
                        isWinner && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClaim(i); }}
                            style={{
                              padding: "0.3rem 0.75rem",
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-body)",
                              fontWeight: 600,
                              background: "var(--ochre)",
                              color: "var(--brown-deepest)",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              letterSpacing: "0.03em",
                            }}
                          >
                            Claim
                          </button>
                        )
                      ) : (
                        tier.winner && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setVisible(true); }}
                            style={{
                              padding: "0.3rem 0.75rem",
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-body)",
                              fontWeight: 600,
                              background: "transparent",
                              color: "var(--ochre)",
                              border: "1px solid var(--ochre)",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Connect Wallet
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Judges */}
          <div>
            <p style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--offwhite-muted)",
              marginBottom: "0.6rem",
            }}>
              Judges ({escrow.judges.length} · threshold {escrow.threshold})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {escrow.judges.map((judge, i) => (
                <span key={i} style={{
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--offwhite-muted)",
                  background: "var(--offwhite-ghost)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 4,
                }}>
                  {truncateAddress(judge.toBase58())}
                </span>
              ))}
            </div>
          </div>

          {/* Organizer full address */}
          <div>
            <p style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--offwhite-muted)",
              marginBottom: "0.35rem",
            }}>
              Organizer
            </p>
            <span style={{
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              color: "var(--ochre-light)",
              wordBreak: "break-all",
            }}>
              {escrow.organizer.toBase58()}
            </span>
          </div>

          {/* Refund button — own expired escrow with unclaimed tiers only */}
          {canRefund && (
            <div style={{ paddingTop: "0.25rem" }}>
              {connected ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRefund(); }}
                  style={{
                    padding: "0.55rem 1.25rem",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    background: "rgba(192,57,43,0.15)",
                    color: "#D9644A",
                    border: "1px solid rgba(192,57,43,0.4)",
                    borderRadius: 5,
                    cursor: "pointer",
                    letterSpacing: "0.03em",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(192,57,43,0.15)")}
                >
                  Refund Unclaimed
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setVisible(true); }}
                  style={{
                    padding: "0.55rem 1.25rem",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    background: "transparent",
                    color: "var(--ochre)",
                    border: "1px solid var(--ochre)",
                    borderRadius: 5,
                    cursor: "pointer",
                  }}
                >
                  Connect Wallet to Refund
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}