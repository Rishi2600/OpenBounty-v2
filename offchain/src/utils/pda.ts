import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "../constants/program";

// Seeds must match exactly what the Rust program uses:
// escrow PDA: ["escrow", organizer_pubkey, nonce]
// vault PDA:  ["vault",  organizer_pubkey, nonce]
//
// nonce is a u8, so one organizer can hold up to 256 escrows at once.

export const deriveEscrowPda = (
  organizer: PublicKey,
  nonce: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.toBuffer(), Buffer.from([nonce])],
    PROGRAM_ID
  );
};

export const deriveVaultPda = (
  organizer: PublicKey,
  nonce: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organizer.toBuffer(), Buffer.from([nonce])],
    PROGRAM_ID
  );
};

// Convenience: derive both at once (common pattern in components)
export const deriveEscrowAccounts = (
  organizer: PublicKey,
  nonce: number
): { escrow: PublicKey; vault: PublicKey } => {
  const [escrow] = deriveEscrowPda(organizer, nonce);
  const [vault] = deriveVaultPda(organizer, nonce);
  return { escrow, vault };
};
