"use client";

// SOL balance of the connected wallet, in lamports. null while unknown or logged out.

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

interface FetchedBalance {
  address: string;
  lamports: number;
}

export function useBalance(): number | null {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [fetched, setFetched] = useState<FetchedBalance | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const address = publicKey.toBase58();
    let cancelled = false;
    connection
      .getBalance(publicKey)
      .then((lamports) => { if (!cancelled) setFetched({ address, lamports }); })
      .catch(() => {}); // stays null, the menu shows "Balance unavailable"

    return () => { cancelled = true; };
  }, [connection, publicKey]);

  // Ignore a balance that belongs to a previously connected wallet
  if (!publicKey || fetched?.address !== publicKey.toBase58()) return null;
  return fetched.lamports;
}
