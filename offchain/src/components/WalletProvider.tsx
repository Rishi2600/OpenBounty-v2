"use client";

// Solana connection + wallet context for the whole app.

import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { Adapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter,
  UnsafeBurnerWalletName,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { USE_MOCKS } from "@/mocks/store";

import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

export default function WalletProvider({ children }: Props) {
  const endpoint = useMemo(() => clusterApiUrl(WalletAdapterNetwork.Devnet), []);

  const wallets = useMemo(() => {
    const list: Adapter[] = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

    // Mock mode only: a throwaway wallet whose key lives in memory and is never
    // saved or funded, so every screen can be used without a wallet extension.
    if (USE_MOCKS) {
      list.push(new UnsafeBurnerWalletAdapter());
    }
    return list;
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MockWalletAutoSelect />
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

// In mock mode, pick the burner wallet once per page load if no wallet is chosen.
// Only once, so "Disconnect" still works for testing the logged-out screens.
function MockWalletAutoSelect() {
  const { wallet, select } = useWallet();
  const done = useRef(false);

  useEffect(() => {
    if (!USE_MOCKS || done.current) return;
    done.current = true;
    if (!wallet) select(UnsafeBurnerWalletName);
  }, [wallet, select]);

  return null;
}
