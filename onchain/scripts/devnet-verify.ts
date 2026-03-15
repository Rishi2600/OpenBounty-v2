// Verifies all 4 instructions of the deployed OpenBounty v2 program on devnet.
// Uses bounty.json as the organizer and winner - no airdrops required.
// Total SOL cost: approximately 0.05 SOL.
//
// Run with: yarn devnet:verify

import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import IDL from "../target/idl/openbounty_v2.json";
import fs from "fs";
import os from "os";

// --- Config ---

const DEVNET_RPC = "https://api.devnet.solana.com";
const WALLET_PATH = "~/.config/solana/bounty.json";
const TIER_AMOUNT_SOL = 0.01;
const TIER_AMOUNT_LAMPORTS = TIER_AMOUNT_SOL * LAMPORTS_PER_SOL;
const DEADLINE_SECONDS = 15; // deadline will pass 15 seconds after init
const MIN_REQUIRED_BALANCE_SOL = 0.1;

// --- Helpers ---

function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function loadKeypair(filepath: string): Keypair {
  const resolved = filepath.replace("~", os.homedir());
  const raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printStep(step: number, total: number, description: string): void {
  console.log(`\n[${step}/${total}] ${description}`);
  console.log("-".repeat(50));
}

// --- Main ---

async function main(): Promise<void> {
  console.log("OpenBounty v2 - Devnet Verification");
  console.log("=".repeat(50));

  // Setup connection and wallet
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const organizer = loadKeypair(WALLET_PATH);

  console.log("Program ID : ", IDL.address);
  console.log("Organizer  : ", organizer.publicKey.toBase58());

  // Check balance before doing anything
  const startingBalance = await connection.getBalance(organizer.publicKey);
  console.log(
    "Balance    : ",
    startingBalance / LAMPORTS_PER_SOL,
    "SOL"
  );

  if (startingBalance < MIN_REQUIRED_BALANCE_SOL * LAMPORTS_PER_SOL) {
    console.error(
      `Insufficient balance. Need at least ${MIN_REQUIRED_BALANCE_SOL} SOL.`
    );
    process.exit(1);
  }

  // Build Anchor program instance
  const wallet = new anchor.Wallet(organizer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program<OpenbountyV2>(IDL as any, provider);

  // Derive PDAs from organizer pubkey
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
    program.programId
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organizer.publicKey.toBuffer()],
    program.programId
  );

  console.log("Escrow PDA : ", escrowPda.toBase58());
  console.log("Vault PDA  : ", vaultPda.toBase58());

  // Generate 5 judge keypairs - judges only need public keys, no SOL
  const judges = Array.from({ length: 5 }, () => Keypair.generate());
  const judgePublicKeys = judges.map((j) => j.publicKey);

  // Organizer acts as winner for tier 0 - no separate wallet or airdrop needed
  const winner = organizer;

  // Deadline: now + 15 seconds
  const deadline = Math.floor(Date.now() / 1000) + DEADLINE_SECONDS;

  // 4 tiers at 0.01 SOL each = 0.04 SOL total locked
  const tierAmounts = Array.from(
    { length: 4 },
    () => new BN(TIER_AMOUNT_LAMPORTS)
  );

  // Step 1: initialize_escrow
  // Creates the escrow PDA, vault PDA, and locks 0.04 SOL in the vault.

  printStep(1, 4, "initialize_escrow");

  const initTx = await program.methods
    .initializeEscrow(
      judgePublicKeys,
      3, // threshold: 3 of 5 judges required
      tierAmounts,
      new BN(deadline)
    )
    .accountsPartial({
      escrow: escrowPda,
      vault: vaultPda,
      organizer: organizer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([organizer])
    .rpc();

  console.log("Signature  : ", initTx);
  console.log("Explorer   : ", explorerUrl(initTx));

  const escrowAccount = await program.account.escrow.fetch(escrowPda);
  console.log("Tiers      : ", escrowAccount.tiers.length);
  console.log("Threshold  : ", escrowAccount.threshold);
  console.log(
    "Deadline   : ",
    new Date(escrowAccount.deadline.toNumber() * 1000).toISOString()
  );

  const vaultBalance = await connection.getBalance(vaultPda);
  console.log("Vault      : ", vaultBalance / LAMPORTS_PER_SOL, "SOL locked");

  // Step 2: finalize_winner
  // Sets the winner for tier 0. Uses mock signatures (non-zero bytes
  // for first 3 judges, all-zero for last 2). This matches the pattern
  // used in the passing localnet tests.

  printStep(2, 4, "finalize_winner (tier 0)");

  const signatures = [
    Array(64).fill(1), // judge 0 - signed
    Array(64).fill(2), // judge 1 - signed
    Array(64).fill(3), // judge 2 - signed
    Array(64).fill(0), // judge 3 - not signed
    Array(64).fill(0), // judge 4 - not signed
  ];

  const finalizeTx = await program.methods
    .finalizeWinner(0, winner.publicKey, signatures as any)
    .accountsPartial({
      escrow: escrowPda,
      organizer: organizer.publicKey,
    })
    .rpc();

  console.log("Signature  : ", finalizeTx);
  console.log("Explorer   : ", explorerUrl(finalizeTx));

  const escrowAfterFinalize = await program.account.escrow.fetch(escrowPda);
  console.log(
    "Winner set : ",
    escrowAfterFinalize.tiers[0].winner?.toBase58()
  );

  // Step 3: claim_prize
  // Winner (organizer) claims the tier 0 prize.
  // SOL moves from vault to winner wallet.

  printStep(3, 4, "claim_prize (tier 0)");

  const balanceBeforeClaim = await connection.getBalance(winner.publicKey);

  const claimTx = await program.methods
    .claimPrize(0)
    .accountsPartial({
      escrow: escrowPda,
      vault: vaultPda,
      winner: winner.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([winner])
    .rpc();

  console.log("Signature  : ", claimTx);
  console.log("Explorer   : ", explorerUrl(claimTx));

  const balanceAfterClaim = await connection.getBalance(winner.publicKey);
  const netReceived =
    (balanceAfterClaim - balanceBeforeClaim) / LAMPORTS_PER_SOL;
  console.log("Net received (after fees): ", netReceived, "SOL");

  const escrowAfterClaim = await program.account.escrow.fetch(escrowPda);
  console.log("Tier 0 claimed: ", escrowAfterClaim.tiers[0].claimed);

  // Step 4: refund_unclaimed
  // Waits for the 15-second deadline to pass, then refunds tiers 1-3
  // (0.03 SOL) back to the organizer.

  printStep(4, 4, "refund_unclaimed (tiers 1, 2, 3)");

  const now = Math.floor(Date.now() / 1000);
  const waitMs = Math.max((deadline - now + 2) * 1000, 0);

  if (waitMs > 0) {
    console.log(`Waiting ${waitMs / 1000}s for deadline to pass...`);
    await sleep(waitMs);
  }

  const balanceBeforeRefund = await connection.getBalance(organizer.publicKey);

  const refundTx = await program.methods
    .refundUnclaimed()
    .accountsPartial({
      escrow: escrowPda,
      vault: vaultPda,
      organizer: organizer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([organizer])
    .rpc();

  console.log("Signature  : ", refundTx);
  console.log("Explorer   : ", explorerUrl(refundTx));

  const balanceAfterRefund = await connection.getBalance(organizer.publicKey);
  const refundReceived =
    (balanceAfterRefund - balanceBeforeRefund) / LAMPORTS_PER_SOL;
  console.log("Refund received (after fees): ", refundReceived, "SOL");

  // Summary

  const finalBalance = await connection.getBalance(organizer.publicKey);
  const totalCost =
    (startingBalance - finalBalance) / LAMPORTS_PER_SOL;

  console.log("\n" + "=".repeat(50));
  console.log("Verification complete. All 4 instructions confirmed on devnet.");
  console.log("=".repeat(50));
  console.log("Total SOL spent (tx fees only): ", totalCost.toFixed(6), "SOL");
  console.log("\nTransaction summary:");
  console.log("  initialize_escrow : ", explorerUrl(initTx));
  console.log("  finalize_winner   : ", explorerUrl(finalizeTx));
  console.log("  claim_prize       : ", explorerUrl(claimTx));
  console.log("  refund_unclaimed  : ", explorerUrl(refundTx));
}

main().catch((err) => {
  console.error("\nVerification failed:", err.message ?? err);
  process.exit(1);
});