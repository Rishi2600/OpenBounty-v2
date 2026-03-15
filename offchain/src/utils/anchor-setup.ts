import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { IDL, OpenbountyV2 } from "../types/openbounty_v2";
import { PROGRAM_ID, CLUSTER_URL } from "../constants/program";

// Returns a typed Program instance connected to devnet.
// wallet: any object with publicKey + signTransaction + signAllTransactions
// (Solana wallet adapter wallets satisfy this interface)
export const getProgram = (
  connection: Connection,
  wallet: Wallet
): Program<OpenbountyV2> => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<OpenbountyV2>(IDL, provider);
};

// Pre-built devnet connection — import this wherever you need read-only access
// (no wallet required for fetching accounts)
export const devnetConnection = new Connection(CLUSTER_URL.devnet, "confirmed");

// Fetch a single escrow account by its PDA address
// Returns null if the account doesn't exist yet
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