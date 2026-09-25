"use client";

import { USE_MOCKS } from "@/mocks/store";

// Thin strip at the top of every page while mock mode is on,
// so sample data is never mistaken for real on-chain data.
export default function MockBanner() {
  if (!USE_MOCKS) return null;

  return (
    <div style={{
      padding: "0.35rem 1rem",
      textAlign: "center",
      fontSize: "0.75rem",
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      letterSpacing: "0.04em",
      background: "var(--ochre-dim)",
      color: "var(--ochre-light)",
      borderBottom: "1px solid var(--border-bright)",
    }}>
      Mock data mode: nothing here is on-chain and no transactions are sent
    </div>
  );
}
