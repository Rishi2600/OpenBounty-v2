import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("openbounty_v2", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OpenbountyV2 as Program<OpenbountyV2>;

  // Test accounts
  let organizer: Keypair;
  let judge1: Keypair;
  let judge2: Keypair;
  let judge3: Keypair;
  let judge4: Keypair;
  let judge5: Keypair;

  before(async () => {
    // Create test keypairs
    organizer = Keypair.generate();
    judge1 = Keypair.generate();
    judge2 = Keypair.generate();
    judge3 = Keypair.generate();
    judge4 = Keypair.generate();
    judge5 = Keypair.generate();

    // Airdrop SOL to organizer for testing
    const airdropSignature = await provider.connection.requestAirdrop(
      organizer.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
  });

  describe("initialize_escrow", () => {
    it("Successfully initializes an escrow with valid parameters", async () => {
      // Derive PDAs
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
        program.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer.publicKey.toBuffer()],
        program.programId
      );

      // Setup test data
      const judges = [
        judge1.publicKey,
        judge2.publicKey,
        judge3.publicKey,
        judge4.publicKey,
        judge5.publicKey,
      ];
      const threshold = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL), // 20 SOL
        new anchor.BN(15 * LAMPORTS_PER_SOL), // 15 SOL
        new anchor.BN(10 * LAMPORTS_PER_SOL), // 10 SOL
        new anchor.BN(5 * LAMPORTS_PER_SOL),  // 5 SOL
      ];
      const deadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days from now
      );

      // Get organizer balance before
      const balanceBefore = await provider.connection.getBalance(
        organizer.publicKey
      );

      // Initialize escrow
      const tx = await program.methods
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
        .accounts({
          escrow: escrowPda,
          vault: vaultPda,
          organizer: organizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizer])
        .rpc();

      console.log("Initialize escrow transaction:", tx);

      // Fetch the escrow account
      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      // Verify escrow data
      assert.equal(
        escrowAccount.organizer.toBase58(),
        organizer.publicKey.toBase58(),
        "Organizer should match"
      );
      assert.equal(escrowAccount.judges.length, 5, "Should have 5 judges");
      assert.equal(escrowAccount.threshold, 3, "Threshold should be 3");
      assert.equal(escrowAccount.tiers.length, 4, "Should have 4 prize tiers");
      assert.equal(
        escrowAccount.deadline.toNumber(),
        deadline.toNumber(),
        "Deadline should match"
      );

      // Verify judges
      for (let i = 0; i < judges.length; i++) {
        assert.equal(
          escrowAccount.judges[i].toBase58(),
          judges[i].toBase58(),
          `Judge ${i + 1} should match`
        );
      }

      // Verify tiers
      assert.equal(
        escrowAccount.tiers[0].amount.toNumber(),
        20 * LAMPORTS_PER_SOL,
        "Tier 0 amount should be 20 SOL"
      );
      assert.equal(
        escrowAccount.tiers[1].amount.toNumber(),
        15 * LAMPORTS_PER_SOL,
        "Tier 1 amount should be 15 SOL"
      );
      assert.equal(
        escrowAccount.tiers[2].amount.toNumber(),
        10 * LAMPORTS_PER_SOL,
        "Tier 2 amount should be 10 SOL"
      );
      assert.equal(
        escrowAccount.tiers[3].amount.toNumber(),
        5 * LAMPORTS_PER_SOL,
        "Tier 3 amount should be 5 SOL"
      );

      // Verify all tiers are unclaimed and have no winner
      escrowAccount.tiers.forEach((tier, index) => {
        assert.isNull(tier.winner, `Tier ${index} should have no winner yet`);
        assert.isFalse(tier.claimed, `Tier ${index} should be unclaimed`);
      });

      // Verify vault received the funds
      const vaultBalance = await provider.connection.getBalance(vaultPda);
      const expectedTotal = 50 * LAMPORTS_PER_SOL; // 20 + 15 + 10 + 5
      assert.equal(
        vaultBalance,
        expectedTotal,
        "Vault should have 50 SOL locked"
      );

      // Verify organizer balance decreased
      const balanceAfter = await provider.connection.getBalance(
        organizer.publicKey
      );
      const balanceDiff = balanceBefore - balanceAfter;
      assert.isAbove(
        balanceDiff,
        expectedTotal,
        "Organizer should have transferred at least 50 SOL (plus rent)"
      );

      console.log("Escrow initialized successfully!");
      console.log(`   Organizer: ${escrowAccount.organizer.toBase58()}`);
      console.log(`   Judges: ${escrowAccount.judges.length}`);
      console.log(`   Threshold: ${escrowAccount.threshold}`);
      console.log(`   Tiers: ${escrowAccount.tiers.length}`);
      console.log(`   Total locked: ${vaultBalance / LAMPORTS_PER_SOL} SOL`);
    });

    it("Fails to initialize with invalid threshold (too high)", async () => {
      const organizer2 = Keypair.generate();
      await provider.connection.requestAirdrop(
        organizer2.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer2.publicKey.toBuffer()],
        program.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer2.publicKey.toBuffer()],
        program.programId
      );

      const judges = [judge1.publicKey, judge2.publicKey, judge3.publicKey];
      const invalidThreshold = 5; // More than number of judges!
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .initializeEscrow(judges, invalidThreshold, tierAmounts, deadline)
          .accounts({
            escrow: escrowPda,
            vault: vaultPda,
            organizer: organizer2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([organizer2])
          .rpc();

        assert.fail("Should have failed with invalid threshold");
      } catch (error) {
        assert.include(
          error.message,
          "InvalidThreshold",
          "Should fail with InvalidThreshold error"
        );
        console.log("Correctly rejected invalid threshold");
      }
    });

    it("Fails to initialize with past deadline", async () => {
      const organizer3 = Keypair.generate();
      await provider.connection.requestAirdrop(
        organizer3.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer3.publicKey.toBuffer()],
        program.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer3.publicKey.toBuffer()],
        program.programId
      );

      const judges = [judge1.publicKey, judge2.publicKey];
      const threshold = 2;
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const pastDeadline = new anchor.BN(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago

      try {
        await program.methods
          .initializeEscrow(judges, threshold, tierAmounts, pastDeadline)
          .accounts({
            escrow: escrowPda,
            vault: vaultPda,
            organizer: organizer3.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([organizer3])
          .rpc();

        assert.fail("Should have failed with invalid deadline");
      } catch (error) {
        assert.include(
          error.message,
          "InvalidDeadline",
          "Should fail with InvalidDeadline error"
        );
        console.log("Correctly rejected past deadline");
      }
    });

    it("Fails to initialize with no judges", async () => {
      const organizer4 = Keypair.generate();
      await provider.connection.requestAirdrop(
        organizer4.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer4.publicKey.toBuffer()],
        program.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer4.publicKey.toBuffer()],
        program.programId
      );

      const emptyJudges = [];
      const threshold = 1;
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .initializeEscrow(emptyJudges, threshold, tierAmounts, deadline)
          .accounts({
            escrow: escrowPda,
            vault: vaultPda,
            organizer: organizer4.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([organizer4])
          .rpc();

        assert.fail("Should have failed with no judges");
      } catch (error) {
        assert.include(
          error.message,
          "NoJudges",
          "Should fail with NoJudges error"
        );
        console.log("Correctly rejected empty judge list");
      }
    });
  });

  // Placeholder tests for future chunks
  describe("finalize_winner (Chunk 2 - Not Implemented Yet)", () => {
    it("Should be implemented in Chunk 2", async () => {
      console.log("finalize_winner - Coming in Chunk 2");
    });
  });

  describe("claim_prize (Chunk 3 - Not Implemented Yet)", () => {
    it("Should be implemented in Chunk 3", async () => {
      console.log("claim_prize - Coming in Chunk 3");
    });
  });

  describe("refund_unclaimed (Chunk 4 - Not Implemented Yet)", () => {
    it("Should be implemented in Chunk 4", async () => {
      console.log("refund_unclaimed - Coming in Chunk 4");
    });
  });
});