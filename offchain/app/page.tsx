"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function HomePage() {
  const { publicKey, disconnect, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch balance whenever the connected wallet changes
  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setBalance(null);
      }
    };

    fetchBalance();
  }, [publicKey, connection]);

  // "Ab12...xY89" — short enough to fit, unique enough to identify
  const truncate = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#1A100A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        fontFamily: "DM Sans, sans-serif",
        color: "#F5EFE6",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", color: "#C8860A", margin: 0 }}>
        OpenBounty v2
      </h1>

      <p style={{ margin: 0, opacity: 0.5 }}>
        Trustless hackathon bounties on Solana
      </p>

      {/* WalletMultiButton handles everything:
          - Shows "Select Wallet" when disconnected
          - Opens the wallet selection modal on click
          - Shows truncated address when connected
          We add our own disconnect button below for explicit control */}
      <WalletMultiButton />

      {connected && publicKey && (
        <div
          style={{
            backgroundColor: "#2A1A0E",
            border: "1px solid #C8860A",
            borderRadius: "12px",
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            minWidth: "280px",
          }}
        >
          <p style={{ margin: 0, opacity: 0.5, fontSize: "0.8rem" }}>
            Connected wallet
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#C8860A",
              letterSpacing: "0.05em",
            }}
          >
            {truncate(publicKey.toBase58())}
          </p>

          <p style={{ margin: 0, opacity: 0.5, fontSize: "0.8rem" }}>
            Devnet balance
          </p>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
          </p>

          <button
            onClick={disconnect}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.5rem",
              backgroundColor: "transparent",
              border: "1px solid #C8860A",
              borderRadius: "8px",
              color: "#C8860A",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </main>
  );
}