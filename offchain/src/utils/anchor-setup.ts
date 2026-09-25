import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "@/types/onchain/openbounty_v2";
import IDL from "@/idl/openbounty_v2.json";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { CLUSTER_URL } from "../constants/program";
import { deriveEscrowPda } from "./pda";

export const getProgram = (
  connection: Connection,
  wallet: AnchorWallet
): Program<OpenbountyV2> => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<OpenbountyV2>(IDL as OpenbountyV2, provider);
};

export const devnetConnection = new Connection(CLUSTER_URL.devnet, "confirmed");

export const fetchEscrow = async (
  program: Program<OpenbountyV2>,
  escrowPda: PublicKey
) => {
  try {
    return await program.account.escrow.fetch(escrowPda);
  } catch {
    return null;
  }
};

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
