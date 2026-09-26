// Program access helpers: connected and read-only program clients, account
// conversion, and nonce lookup for new escrows.

import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, IdlAccounts, Program } from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { OpenbountyV2 } from "@/types/onchain/openbounty_v2";
import IDL from "@/idl/openbounty_v2.json";
import type { EscrowAccount } from "@/types/escrow";
import { CLUSTER_URL } from "../constants/program";
import { deriveEscrowPda } from "./pda";

export const devnetConnection = new Connection(CLUSTER_URL.devnet, "confirmed");

// Program client that signs with the connected wallet
export const getProgram = (
  connection: Connection,
  wallet: AnchorWallet
): Program<OpenbountyV2> => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<OpenbountyV2>(IDL as OpenbountyV2, provider);
};

// Program client for reading only, so pages work without a wallet.
// Its wallet never signs anything.
export function getReadOnlyProgram(): Program<OpenbountyV2> {
  const readOnlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  } as AnchorWallet;
  return getProgram(devnetConnection, readOnlyWallet);
}

// Decoded on-chain account -> the EscrowAccount shape the UI uses
export function toEscrowAccount(
  publicKey: PublicKey,
  account: IdlAccounts<OpenbountyV2>["escrow"]
): EscrowAccount {
  return {
    publicKey,
    title:       account.title,
    metadataUri: account.metadataUri,
    organizer:   account.organizer,
    asset:       "SOL", // the deployed program only holds SOL
    nonce:       account.nonce,
    judges:      account.judges,
    threshold:   account.threshold,
    tiers:       account.tiers,
    deadline:    account.deadline,
    bump:        account.bump,
    vaultBump:   account.vaultBump,
  };
}

// Lowest nonce (0–255) with no escrow account for this organizer.
// Closed escrows free their nonce, so gaps get reused.
// getMultipleAccountsInfo takes at most 100 keys, hence the batches.
export const findNextNonce = async (
  connection: Connection,
  organizer: PublicKey
): Promise<number> => {
  for (let start = 0; start < 256; start += 100) {
    const nonces = Array.from(
      { length: Math.min(100, 256 - start) },
      (_, i) => start + i
    );
    const pdas  = nonces.map((n) => deriveEscrowPda(organizer, n)[0]);
    const infos = await connection.getMultipleAccountsInfo(pdas);
    const free  = infos.findIndex((info) => info === null);
    if (free !== -1) return nonces[free];
  }
  throw new Error("This wallet already has the maximum of 256 open bounties.");
};
