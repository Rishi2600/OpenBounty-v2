"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const NAV_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Create Bounty", href: "/create" },
  { label: "Claim Bounty", href: "/claim" },
];

const truncate = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

export default function Header() {
  const pathname = usePathname();
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(26, 16, 10, 0.88)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          textDecoration: "none",
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "var(--shadow-ochre)",
            flexShrink: 0,
          }}>
            <Image
              src="/icon.png"
              alt="OpenBounty"
              width={38}
              height={38}
              style={{ display: "block" }}
            />
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.35rem",
            color: "var(--offwhite)",
            letterSpacing: "0.01em",
          }}>
            OpenBounty
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 0 }}>
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0.6rem 1.25rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: isActive ? "var(--ochre-light)" : "var(--offwhite-muted)",
                  textDecoration: "none",
                  borderBottom: isActive
                    ? "2px solid var(--ochre)"
                    : "2px solid transparent",
                  letterSpacing: "0.03em",
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet button */}
        <button
          onClick={handleWalletClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.1rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: connected ? "var(--offwhite)" : "var(--brown-deepest)",
            background: connected ? "var(--success)" : "var(--ochre)",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            letterSpacing: "0.03em",
            transition: "background 0.2s, transform 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {/* Wallet icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
          </svg>
          <span>
            {connected && publicKey
              ? truncate(publicKey.toBase58())
              : "Connect Wallet"}
          </span>
        </button>

      </div>
    </header>
  );
}