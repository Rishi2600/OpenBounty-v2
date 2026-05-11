"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCreateBounty, validateForm, CreateBountyValues, ValidationErrors } from "@/hooks/useCreateBounty";
import { explorerUrl } from "@/constants/program";

// ---------------------------------------------------------------------------
// Small reusable field wrapper
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{
        fontSize: "0.72rem",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: error ? "#D9644A" : "var(--offwhite-muted)",
      }}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <span style={{
          fontSize: "0.72rem",
          color: "var(--offwhite-muted)",
          fontFamily: "var(--font-body)",
          opacity: 0.7,
        }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{
          fontSize: "0.72rem",
          color: "#D9644A",
          fontFamily: "var(--font-body)",
        }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared input style
// ---------------------------------------------------------------------------

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "0.6rem 0.85rem",
  fontFamily: "var(--font-body)",
  fontSize: "0.875rem",
  color: "var(--offwhite)",
  background: "var(--brown-deepest)",
  border: `1px solid ${hasError ? "#D9644A" : "var(--border)"}`,
  borderRadius: 5,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
});

const monoInputStyle = (hasError?: boolean): React.CSSProperties => ({
  ...inputStyle(hasError),
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
});

// ---------------------------------------------------------------------------
// CreateBountyForm
// ---------------------------------------------------------------------------

export default function CreateBountyForm() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { submit, loading, error, txSignature, reset } = useCreateBounty();

  // Form state
  const [title,       setTitle]       = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [judges,      setJudges]      = useState<string[]>([""]);
  const [threshold,   setThreshold]   = useState(1);
  const [tierAmounts, setTierAmounts] = useState<number[]>([0]);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [errors,      setErrors]      = useState<ValidationErrors>({});
  const [touched,     setTouched]     = useState(false);

  // Redirect to dashboard after successful tx
  useEffect(() => {
    if (txSignature) {
      const timer = setTimeout(() => router.push("/"), 3000);
      return () => clearTimeout(timer);
    }
  }, [txSignature, router]);

  // Re-validate on change once user has tried submitting
  useEffect(() => {
    if (!touched) return;
    const vals = buildValues();
    setErrors(validateForm(vals));
  }, [title, metadataUri, judges, threshold, tierAmounts, deadlineDate, touched]);

  const buildValues = (): CreateBountyValues => ({
    title,
    metadataUri,
    judges: judges.filter((j) => j.trim() !== ""),
    threshold,
    tierAmounts: tierAmounts.filter((a) => a > 0),
    deadlineDate,
  });

  const handleSubmit = async () => {
    setTouched(true);
    const vals = buildValues();
    const errs = validateForm(vals);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await submit(vals);
  };

  // Judge helpers
  const addJudge = () => {
    if (judges.length >= 5) return;
    setJudges([...judges, ""]);
  };
  const removeJudge = (i: number) => {
    const next = judges.filter((_, idx) => idx !== i);
    setJudges(next.length > 0 ? next : [""]);
    if (threshold > next.filter(j => j.trim()).length) {
      setThreshold(Math.max(1, next.filter(j => j.trim()).length));
    }
  };
  const updateJudge = (i: number, val: string) => {
    const next = [...judges];
    next[i] = val;
    setJudges(next);
  };

  // Tier helpers
  const addTier = () => {
    if (tierAmounts.length >= 4) return;
    setTierAmounts([...tierAmounts, 0]);
  };
  const removeTier = (i: number) => {
    const next = tierAmounts.filter((_, idx) => idx !== i);
    setTierAmounts(next.length > 0 ? next : [0]);
  };
  const updateTier = (i: number, val: number) => {
    const next = [...tierAmounts];
    next[i] = val;
    setTierAmounts(next);
  };

  const totalSol = tierAmounts.reduce((s, a) => s + (a || 0), 0);

  // Min date for deadline picker — tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  if (txSignature) {
    return (
      <div style={{
        textAlign: "center",
        padding: "3rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(125,154,92,0.15)",
          border: "2px solid #9DBD72",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="#9DBD72" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.4rem",
          color: "var(--offwhite)",
        }}>
          Bounty Created!
        </p>

        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          color: "var(--offwhite-muted)",
        }}>
          Redirecting to dashboard in 3 seconds...
        </p>

        <a
          href={explorerUrl(txSignature)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.78rem",
            fontFamily: "var(--font-mono)",
            color: "var(--ochre-light)",
            wordBreak: "break-all",
            textDecoration: "none",
            borderBottom: "1px solid var(--ochre-dim)",
          }}
        >
          {txSignature.slice(0, 24)}...{txSignature.slice(-8)} ↗
        </a>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not connected state
  // ---------------------------------------------------------------------------

  if (!connected) {
    return (
      <div style={{
        textAlign: "center",
        padding: "3rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.15rem",
          color: "var(--offwhite-muted)",
          fontStyle: "italic",
        }}>
          Connect your wallet to create a bounty
        </p>
        <button
          onClick={() => setVisible(true)}
          style={{
            padding: "0.6rem 1.5rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: "var(--ochre)",
            color: "var(--brown-deepest)",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Title */}
      <Field label="Title" hint="Max 50 characters" error={errors.title}>
        <input
          type="text"
          value={title}
          maxLength={50}
          placeholder="e.g. ETHIndia 2024"
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle(!!errors.title)}
        />
        <span style={{
          fontSize: "0.68rem",
          color: title.length > 45 ? "#D9644A" : "var(--offwhite-muted)",
          fontFamily: "var(--font-body)",
          alignSelf: "flex-end",
          opacity: 0.8,
        }}>
          {title.length}/50
        </span>
      </Field>

      {/* Metadata URI */}
      <Field
        label="Metadata URI"
        hint="Optional — IPFS or Arweave link to bounty metadata JSON"
        error={errors.metadataUri}
      >
        <input
          type="text"
          value={metadataUri}
          maxLength={100}
          placeholder="ipfs://Qm... or https://arweave.net/..."
          onChange={(e) => setMetadataUri(e.target.value)}
          style={monoInputStyle(!!errors.metadataUri)}
        />
      </Field>

      {/* Judges */}
      <Field
        label={`Judges (${judges.filter(j => j.trim()).length}/5)`}
        hint="Add up to 5 judge wallet addresses"
        error={errors.judges}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {judges.map((judge, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="text"
                value={judge}
                placeholder={`Judge ${i + 1} public key`}
                onChange={(e) => updateJudge(i, e.target.value)}
                style={{ ...monoInputStyle(!!errors.judges), flex: 1 }}
              />
              {judges.length > 1 && (
                <button
                  onClick={() => removeJudge(i)}
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: "rgba(192,57,43,0.12)",
                    border: "1px solid rgba(192,57,43,0.3)",
                    borderRadius: 4,
                    color: "#D9644A",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
          {judges.length < 5 && (
            <button
              onClick={addJudge}
              style={{
                alignSelf: "flex-start",
                padding: "0.35rem 0.85rem",
                fontSize: "0.78rem",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                background: "transparent",
                color: "var(--ochre)",
                border: "1px solid var(--border-bright)",
                borderRadius: 4,
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              + Add Judge
            </button>
          )}
        </div>
      </Field>

      {/* Threshold */}
      <Field
        label="Signature Threshold"
        hint="Minimum number of judges required to finalize a winner"
        error={errors.threshold}
      >
        <input
          type="number"
          value={threshold}
          min={1}
          max={judges.filter(j => j.trim()).length || 1}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ ...inputStyle(!!errors.threshold), maxWidth: 120 }}
        />
      </Field>

      {/* Prize Tiers */}
      <Field
        label={`Prize Tiers (${tierAmounts.length}/4)`}
        hint={`Total: ${totalSol.toFixed(2)} SOL will be locked in escrow`}
        error={errors.tierAmounts}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {tierAmounts.map((amt, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{
                fontSize: "0.72rem",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                color: "var(--offwhite-muted)",
                minWidth: "3.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Tier {i + 1}
              </span>
              <input
                type="number"
                value={amt || ""}
                min={0}
                step={0.1}
                placeholder="0.00"
                onChange={(e) => updateTier(i, parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle(!!errors.tierAmounts), flex: 1 }}
              />
              <span style={{
                fontSize: "0.78rem",
                fontFamily: "var(--font-body)",
                color: "var(--offwhite-muted)",
                flexShrink: 0,
              }}>
                SOL
              </span>
              {tierAmounts.length > 1 && (
                <button
                  onClick={() => removeTier(i)}
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: "rgba(192,57,43,0.12)",
                    border: "1px solid rgba(192,57,43,0.3)",
                    borderRadius: 4,
                    color: "#D9644A",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
          {tierAmounts.length < 4 && (
            <button
              onClick={addTier}
              style={{
                alignSelf: "flex-start",
                padding: "0.35rem 0.85rem",
                fontSize: "0.78rem",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                background: "transparent",
                color: "var(--ochre)",
                border: "1px solid var(--border-bright)",
                borderRadius: 4,
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              + Add Tier
            </button>
          )}
        </div>
      </Field>

      {/* Deadline */}
      <Field label="Deadline" hint="The date after which unclaimed prizes can be refunded" error={errors.deadlineDate}>
        <input
          type="date"
          value={deadlineDate}
          min={minDateStr}
          onChange={(e) => setDeadlineDate(e.target.value)}
          style={{
            ...inputStyle(!!errors.deadlineDate),
            maxWidth: 200,
            colorScheme: "dark",
          }}
        />
      </Field>

      {/* Transaction error */}
      {error && (
        <div style={{
          padding: "0.75rem 1rem",
          background: "rgba(192,57,43,0.1)",
          border: "1px solid rgba(192,57,43,0.3)",
          borderRadius: 6,
          fontSize: "0.82rem",
          fontFamily: "var(--font-body)",
          color: "#D9644A",
        }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "0.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <span style={{
          fontSize: "0.78rem",
          fontFamily: "var(--font-body)",
          color: "var(--offwhite-muted)",
        }}>
          {totalSol > 0 && `${totalSol.toFixed(2)} SOL will be locked on submit`}
        </span>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "0.65rem 2rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            fontWeight: 700,
            background: loading ? "var(--brown-muted)" : "var(--ochre)",
            color: "var(--brown-deepest)",
            border: "none",
            borderRadius: 5,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            transition: "background 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating Bounty..." : "Create Bounty"}
        </button>
      </div>

    </div>
  );
}