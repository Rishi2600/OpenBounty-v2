import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "../constants/program";

// Seeds must match exactly what the Rust program uses:
// escrow PDA: ["escrow", organizer_pubkey]
// vault PDA:  ["vault",  organizer_pubkey]

export const deriveEscrowPda = (
  organizer: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.toBuffer()],
    PROGRAM_ID
  );
};

export const deriveVaultPda = (
  organizer: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organizer.toBuffer()],
    PROGRAM_ID
  );
};

// Convenience: derive both at once (common pattern in components)
export const deriveEscrowAccounts = (
  organizer: PublicKey
): { escrow: PublicKey; vault: PublicKey } => {
  const [escrow] = deriveEscrowPda(organizer);
  const [vault] = deriveVaultPda(organizer);
  return { escrow, vault };
};