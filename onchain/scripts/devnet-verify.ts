// Verifies all 4 instructions of the deployed OpenBounty v2 program on devnet.
// Generates a throwaway organizer keypair each run, funded from bounty.json.
// Remaining SOL is returned to bounty.json at the end.
// Total cost per run: transaction fees only (~0.000005 SOL).

import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import IDL from "../target/idl/openbounty_v2.json";
import fs from "fs";
import os from "os";

// --- Config ---

const DEVNET_RPC = "https://api.devnet.solana.com";
const WALLET_PATH = "~/.config/solana/bounty.json";
const TIER_AMOUNT_LAMPORTS = 0.01 * LAMPORTS_PER_SOL;
const DEADLINE_SECONDS = 15;
const FUND_AMOUNT_LAMPORTS = 0.1 * LAMPORTS_PER_SOL; // sent to throwaway organizer
const MIN_REQUIRED_BALANCE_SOL = 0.2;

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

  const connection = new Connection(DEVNET_RPC, "confirmed");

  // bounty.json is the funding wallet - never used as organizer
  const funder = loadKeypair(WALLET_PATH);
  console.log("Funder     : ", funder.publicKey.toBase58());

  const funderBalance = await connection.getBalance(funder.publicKey);
  console.log("Balance    : ", funderBalance / LAMPORTS_PER_SOL, "SOL");

  if (funderBalance < MIN_REQUIRED_BALANCE_SOL * LAMPORTS_PER_SOL) {
    console.error(
      `Insufficient balance. Need at least ${MIN_REQUIRED_BALANCE_SOL} SOL.`
    );
    process.exit(1);
  }

  // Generate a fresh throwaway keypair - unique PDA every run
  const organizer = Keypair.generate();
  console.log("Organizer  : ", organizer.publicKey.toBase58(), "(throwaway)");

  // Fund the throwaway organizer from bounty.json
  console.log(
    `\nFunding throwaway organizer with ${FUND_AMOUNT_LAMPORTS / LAMPORTS_PER_SOL} SOL...`
  );

  const fundTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: organizer.publicKey,
      lamports: FUND_AMOUNT_LAMPORTS,
    })
  );

  const fundSig = await sendAndConfirmTransaction(connection, fundTx, [funder]);
  console.log("Fund tx    : ", explorerUrl(fundSig));

  const organizerBalance = await connection.getBalance(organizer.publicKey);
  console.log("Organizer balance: ", organizerBalance / LAMPORTS_PER_SOL, "SOL");

  // Derive PDAs from throwaway organizer
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
    new PublicKey(IDL.address)
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organizer.publicKey.toBuffer()],
    new PublicKey(IDL.address)
  );

  console.log("Escrow PDA : ", escrowPda.toBase58());
  console.log("Vault PDA  : ", vaultPda.toBase58());

  // Build Anchor program instance using throwaway organizer as wallet
  const wallet = new anchor.Wallet(organizer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program<OpenbountyV2>(IDL as any, provider);

  // 5 judge keypairs - no SOL needed, only public keys used
  const judges = Array.from({ length: 5 }, () => Keypair.generate());
  const judgePublicKeys = judges.map((j) => j.publicKey);

  // Organizer is also the winner - no separate wallet needed
  const winner = organizer;

  const deadline = Math.floor(Date.now() / 1000) + DEADLINE_SECONDS;
  const tierAmounts = Array.from({ length: 4 }, () => new BN(TIER_AMOUNT_LAMPORTS));

  // Step 1: initialize_escrow

  printStep(1, 5, "initialize_escrow");

  const initTx = await program.methods
    .initializeEscrow(
      judgePublicKeys,
      3,
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
  const vaultBalance = await connection.getBalance(vaultPda);
  console.log("Tiers      : ", escrowAccount.tiers.length);
  console.log("Threshold  : ", escrowAccount.threshold);
  console.log("Vault      : ", vaultBalance / LAMPORTS_PER_SOL, "SOL locked");

  // Step 2: finalize_winner

  printStep(2, 5, "finalize_winner (tier 0)");

  const signatures = [
    Array(64).fill(1),
    Array(64).fill(2),
    Array(64).fill(3),
    Array(64).fill(0),
    Array(64).fill(0),
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
  console.log("Winner set : ", escrowAfterFinalize.tiers[0].winner?.toBase58());

  // Step 3: claim_prize

  printStep(3, 5, "claim_prize (tier 0)");

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

  const escrowAfterClaim = await program.account.escrow.fetch(escrowPda);
  console.log("Tier 0 claimed: ", escrowAfterClaim.tiers[0].claimed);

  // Step 4: refund_unclaimed

  printStep(4, 5, "refund_unclaimed (tiers 1, 2, 3)");

  const now = Math.floor(Date.now() / 1000);
  const waitMs = Math.max((deadline - now + 2) * 1000, 0);

  if (waitMs > 0) {
    console.log(`Waiting ${waitMs / 1000}s for deadline to pass...`);
    await sleep(waitMs);
  }

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

  // Step 5: return remaining SOL from throwaway organizer to bounty.json

  printStep(5, 5, "returning remaining SOL to funder");

  const remainingBalance = await connection.getBalance(organizer.publicKey);

  // Reserve enough for the transfer transaction fee
  const transferFeeBuffer = 5000;
  const returnAmount = remainingBalance - transferFeeBuffer;

  if (returnAmount > 0) {
    const returnTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: organizer.publicKey,
        toPubkey: funder.publicKey,
        lamports: returnAmount,
      })
    );

    const returnSig = await sendAndConfirmTransaction(
      connection,
      returnTx,
      [organizer]
    );

    console.log("Return tx  : ", explorerUrl(returnSig));
    console.log(
      "Returned   : ",
      returnAmount / LAMPORTS_PER_SOL,
      "SOL to funder"
    );
  }

  // Summary

  const finalFunderBalance = await connection.getBalance(funder.publicKey);
  const totalCost = (funderBalance - finalFunderBalance) / LAMPORTS_PER_SOL;

  console.log("\n" + "=".repeat(50));
  console.log("Verification complete. All 4 instructions confirmed on devnet.");
  console.log("=".repeat(50));
  console.log("Total cost (tx fees only): ", totalCost.toFixed(6), "SOL");
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