"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const NAV_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Create Bounty", href: "/create" },
  { label: "Claim Bounty", href: "/claim" },
];

const truncate = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

export default function Header() {
  const pathname = usePathname();
  const { publicKey, disconnect, connected, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch balance whenever wallet connects or changes
  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    connection.getBalance(publicKey).then((lamports) => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });
  }, [publicKey, connection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWalletClick = () => {
    if (connected) {
      setDropdownOpen((prev) => !prev);
    } else {
      setVisible(true);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setDropdownOpen(false);
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
          flexShrink: 0,
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
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet button + dropdown */}
        <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={handleWalletClick}
            disabled={connecting}
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
              cursor: connecting ? "not-allowed" : "pointer",
              opacity: connecting ? 0.7 : 1,
              letterSpacing: "0.03em",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {/* Show wallet's own icon when connected, fallback to generic icon */}
            {connected && wallet?.adapter.icon ? (
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                width={18}
                height={18}
                style={{ borderRadius: 3 }}
              />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            )}
            <span>
              {connecting
                ? "Connecting..."
                : connected && publicKey
                ? truncate(publicKey.toBase58())
                : "Connect Wallet"}
            </span>
          </button>

          {/* Dropdown — only when connected and toggled */}
          {connected && dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              minWidth: "260px",
              background: "var(--brown-dark)",
              border: "1px solid var(--border-bright)",
              borderRadius: 8,
              boxShadow: "var(--shadow-warm)",
              overflow: "hidden",
              zIndex: 200,
            }}>

              {/* Wallet name + icon + connected badge */}
              <div style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--border)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}>
                  {wallet?.adapter.icon && (
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      width={20}
                      height={20}
                      style={{ borderRadius: 4 }}
                    />
                  )}
                  <span style={{
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    color: "var(--offwhite)",
                  }}>
                    {wallet?.adapter.name}
                  </span>
                  <span style={{
                    marginLeft: "auto",
                    fontSize: "0.65rem",
                    padding: "0.15rem 0.4rem",
                    background: "rgba(125, 154, 92, 0.2)",
                    color: "#9DBD72",
                    borderRadius: 3,
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    Connected
                  </span>
                </div>

                {/* Full address */}
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--ochre-light)",
                  fontFamily: "var(--font-mono)",
                  wordBreak: "break-all",
                  marginBottom: "0.75rem",
                }}>
                  {publicKey?.toBase58()}
                </p>

                {/* Balance */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border)",
                }}>
                  <span style={{
                    fontSize: "0.7rem",
                    color: "var(--offwhite-muted)",
                    fontFamily: "var(--font-body)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}>
                    Devnet Balance
                  </span>
                  <span style={{
                    fontSize: "0.95rem",
                    color: "var(--offwhite)",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                  }}>
                    {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
                  </span>
                </div>
              </div>

              {/* Copy address */}
              <button
                onClick={handleCopyAddress}
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--offwhite-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--offwhite-ghost)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy Address
              </button>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "transparent",
                  border: "none",
                  color: "#D9644A",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(192, 57, 43, 0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Disconnect
              </button>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}