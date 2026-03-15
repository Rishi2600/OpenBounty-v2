import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../../../onchain/target/types/openbounty_v2";
import IDL from "../../../onchain/target/idl/openbounty_v2.json";
import { CLUSTER_URL } from "../constants/program";

export const getProgram = (
  connection: Connection,
  wallet: Wallet
): Program<OpenbountyV2> => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<OpenbountyV2>(IDL as any, provider);
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