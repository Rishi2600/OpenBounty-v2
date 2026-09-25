"use client";

import CreateBountyForm from "@/components/create/CreateBountyForm";

export default function CreateBountyPage() {
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
    </div>
  );
}
