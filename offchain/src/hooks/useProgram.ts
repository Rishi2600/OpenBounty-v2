"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../../../onchain/target/types/openbounty_v2";
import { getProgram } from "../utils/anchor-setup";

export function useProgram(): Program<OpenbountyV2> | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    return getProgram(connection, wallet);
  }, [connection, wallet]);
}