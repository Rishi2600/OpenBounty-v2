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
      100 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(airdropSignature);
  });

  describe("initialize_escrow", () => {
    it("Successfully initializes an escrow with valid parameters", async () => {
      // Derive PDAs
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
        program.programId,
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer.publicKey.toBuffer()],
        program.programId,
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
        new anchor.BN(5 * LAMPORTS_PER_SOL), // 5 SOL
      ];
      const deadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
      );

      // Get organizer balance before
      const balanceBefore = await provider.connection.getBalance(
        organizer.publicKey,
      );

      // Initialize escrow
      const tx = await program.methods
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
        .accountsPartial({
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
        "Organizer should match",
      );
      assert.equal(escrowAccount.judges.length, 5, "Should have 5 judges");
      assert.equal(escrowAccount.threshold, 3, "Threshold should be 3");
      assert.equal(escrowAccount.tiers.length, 4, "Should have 4 prize tiers");
      assert.equal(
        escrowAccount.deadline.toNumber(),
        deadline.toNumber(),
        "Deadline should match",
      );

      // Verify judges
      for (let i = 0; i < judges.length; i++) {
        assert.equal(
          escrowAccount.judges[i].toBase58(),
          judges[i].toBase58(),
          `Judge ${i + 1} should match`,
        );
      }

      // Verify tiers
      assert.equal(
        escrowAccount.tiers[0].amount.toNumber(),
        20 * LAMPORTS_PER_SOL,
        "Tier 0 amount should be 20 SOL",
      );
      assert.equal(
        escrowAccount.tiers[1].amount.toNumber(),
        15 * LAMPORTS_PER_SOL,
        "Tier 1 amount should be 15 SOL",
      );
      assert.equal(
        escrowAccount.tiers[2].amount.toNumber(),
        10 * LAMPORTS_PER_SOL,
        "Tier 2 amount should be 10 SOL",
      );
      assert.equal(
        escrowAccount.tiers[3].amount.toNumber(),
        5 * LAMPORTS_PER_SOL,
        "Tier 3 amount should be 5 SOL",
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
        "Vault should have 50 SOL locked",
      );

      // Verify organizer balance decreased
      const balanceAfter = await provider.connection.getBalance(
        organizer.publicKey,
      );
      const balanceDiff = balanceBefore - balanceAfter;
      assert.isAbove(
        balanceDiff,
        expectedTotal,
        "Organizer should have transferred at least 50 SOL (plus rent)",
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
        10 * LAMPORTS_PER_SOL,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer2.publicKey.toBuffer()],
        program.programId,
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer2.publicKey.toBuffer()],
        program.programId,
      );

      const judges = [judge1.publicKey, judge2.publicKey, judge3.publicKey];
      const invalidThreshold = 5; // More than number of judges!
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .initializeEscrow(judges, invalidThreshold, tierAmounts, deadline)
          .accountsPartial({
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
          "Should fail with InvalidThreshold error",
        );
        console.log("Correctly rejected invalid threshold");
      }
    });

    it("Fails to initialize with past deadline", async () => {
      const organizer3 = Keypair.generate();
      await provider.connection.requestAirdrop(
        organizer3.publicKey,
        10 * LAMPORTS_PER_SOL,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer3.publicKey.toBuffer()],
        program.programId,
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer3.publicKey.toBuffer()],
        program.programId,
      );

      const judges = [judge1.publicKey, judge2.publicKey];
      const threshold = 2;
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const pastDeadline = new anchor.BN(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago

      try {
        await program.methods
          .initializeEscrow(judges, threshold, tierAmounts, pastDeadline)
          .accountsPartial({
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
          "Should fail with InvalidDeadline error",
        );
        console.log("Correctly rejected past deadline");
      }
    });

    it("Fails to initialize with no judges", async () => {
      const organizer4 = Keypair.generate();
      await provider.connection.requestAirdrop(
        organizer4.publicKey,
        10 * LAMPORTS_PER_SOL,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer4.publicKey.toBuffer()],
        program.programId,
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer4.publicKey.toBuffer()],
        program.programId,
      );

      const emptyJudges = [];
      const threshold = 1;
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .initializeEscrow(emptyJudges, threshold, tierAmounts, deadline)
          .accountsPartial({
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
          "Should fail with NoJudges error",
        );
        console.log("Correctly rejected empty judge list");
      }
    });
  });

  describe("finalize_winner", () => {
    let escrowPda: PublicKey;
    let vaultPda: PublicKey;
    let organizerForFinalize: Keypair;
    let judgesForFinalize: Keypair[];

    before(async () => {
      // Create fresh keypairs for finalize tests
      organizerForFinalize = Keypair.generate();
      judgesForFinalize = [
        Keypair.generate(),
        Keypair.generate(),
        Keypair.generate(),
        Keypair.generate(),
        Keypair.generate(),
      ];

      // Airdrop SOL to organizer
      const airdropSig = await provider.connection.requestAirdrop(
        organizerForFinalize.publicKey,
        100 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Derive PDAs
      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizerForFinalize.publicKey.toBuffer()],
        program.programId,
      );

      [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizerForFinalize.publicKey.toBuffer()],
        program.programId,
      );

      // Initialize escrow first
      const judges = judgesForFinalize.map((j) => j.publicKey);
      const threshold = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
        new anchor.BN(10 * LAMPORTS_PER_SOL),
        new anchor.BN(5 * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      );

      await program.methods
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
        .accountsPartial({
          escrow: escrowPda,
          vault: vaultPda,
          organizer: organizerForFinalize.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForFinalize])
        .rpc();
    });

    it("Successfully finalizes winner with valid signatures (3 of 5)", async () => {
      const winner = Keypair.generate();
      const tier = 0;

      // Create message that judges will "sign"
      const message = `tier:${tier},winner:${winner.publicKey.toBase58()}`;
      console.log("Message to sign:", message);

      // Simulate signatures from 3 judges
      // In real implementation, each judge would sign with their private key
      // For testing, we create mock 64-byte signatures
      const signatures: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(1) as any, // Judge 0 signature
        Array(64).fill(2) as any, // Judge 1 signature
        Array(64).fill(3) as any, // Judge 2 signature
        Array(64).fill(0) as any, // Judge 3 no signature
        Array(64).fill(0) as any, // Judge 4 no signature
      ];

      // Call finalize_winner
      const tx = await program.methods
        .finalizeWinner(tier, winner.publicKey, signatures)
        .accounts({
          escrow: escrowPda,
          organizer: organizerForFinalize.publicKey,
        })
        .rpc();

      console.log("Finalize winner transaction:", tx);

      // Fetch escrow and verify winner is set
      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.isNotNull(
        escrowAccount.tiers[tier].winner,
        "Winner should be set",
      );
      assert.equal(
        escrowAccount.tiers[tier].winner.toBase58(),
        winner.publicKey.toBase58(),
        "Winner should match",
      );
      assert.isFalse(
        escrowAccount.tiers[tier].claimed,
        "Tier should not be claimed yet",
      );

      console.log("Winner finalized successfully for tier", tier);
      console.log(
        "Winner address:",
        escrowAccount.tiers[tier].winner.toBase58(),
      );
    });

    it("Fails to finalize with insufficient signatures (only 2 of 5)", async () => {
      const winner = Keypair.generate();
      const tier = 1;

      // Only 2 signatures (threshold is 3)
      const signatures: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(1) as any, // Judge 0 signature
        Array(64).fill(2) as any, // Judge 1 signature
        Array(64).fill(0) as any, // Judge 2 no signature
        Array(64).fill(0) as any, // Judge 3 no signature
        Array(64).fill(0) as any, // Judge 4 no signature
      ];

      try {
        await program.methods
          .finalizeWinner(tier, winner.publicKey, signatures)
          .accounts({
            escrow: escrowPda,
            organizer: organizerForFinalize.publicKey,
          })
          .rpc();

        assert.fail("Should have failed with insufficient signatures");
      } catch (error) {
        assert.include(
          error.message,
          "InsufficientSignatures",
          "Should fail with InsufficientSignatures error",
        );
        console.log("Correctly rejected insufficient signatures");
      }
    });

    it("Fails to finalize tier that is already finalized", async () => {
      const anotherWinner = Keypair.generate();
      const tier = 0; // Already finalized in first test

      const signatures: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(1) as any,
        Array(64).fill(2) as any,
        Array(64).fill(3) as any,
        Array(64).fill(0) as any,
        Array(64).fill(0) as any,
      ];

      try {
        await program.methods
          .finalizeWinner(tier, anotherWinner.publicKey, signatures)
          .accounts({
            escrow: escrowPda,
            organizer: organizerForFinalize.publicKey,
          })
          .rpc();

        assert.fail("Should have failed - tier already finalized");
      } catch (error) {
        assert.include(
          error.message,
          "AlreadyFinalized",
          "Should fail with AlreadyFinalized error",
        );
        console.log("Correctly rejected already finalized tier");
      }
    });

    it("Fails to finalize with invalid tier index", async () => {
      const winner = Keypair.generate();
      const invalidTier = 10; // Only have 4 tiers (0-3)

      const signatures: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(1) as any,
        Array(64).fill(2) as any,
        Array(64).fill(3) as any,
        Array(64).fill(0) as any,
        Array(64).fill(0) as any,
      ];

      try {
        await program.methods
          .finalizeWinner(invalidTier, winner.publicKey, signatures)
          .accounts({
            escrow: escrowPda,
            organizer: organizerForFinalize.publicKey,
          })
          .rpc();

        assert.fail("Should have failed with invalid tier");
      } catch (error) {
        assert.include(
          error.message,
          "InvalidTier",
          "Should fail with InvalidTier error",
        );
        console.log("Correctly rejected invalid tier index");
      }
    });

    it("Can finalize multiple different tiers independently", async () => {
      const winner2 = Keypair.generate();
      const winner3 = Keypair.generate();

      // Finalize tier 2
      const signatures2: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(1) as any,
        Array(64).fill(2) as any,
        Array(64).fill(3) as any,
        Array(64).fill(0) as any,
        Array(64).fill(0) as any,
      ];

      await program.methods
        .finalizeWinner(2, winner2.publicKey, signatures2)
        .accounts({
          escrow: escrowPda,
          organizer: organizerForFinalize.publicKey,
        })
        .rpc();

      // Finalize tier 3
      const signatures3: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(4) as any,
        Array(64).fill(5) as any,
        Array(64).fill(6) as any,
        Array(64).fill(0) as any,
        Array(64).fill(0) as any,
      ];

      await program.methods
        .finalizeWinner(3, winner3.publicKey, signatures3)
        .accounts({
          escrow: escrowPda,
          organizer: organizerForFinalize.publicKey,
        })
        .rpc();

      // Verify both tiers are finalized
      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.equal(
        escrowAccount.tiers[2].winner.toBase58(),
        winner2.publicKey.toBase58(),
        "Tier 2 winner should match",
      );
      assert.equal(
        escrowAccount.tiers[3].winner.toBase58(),
        winner3.publicKey.toBase58(),
        "Tier 3 winner should match",
      );

      console.log("Successfully finalized multiple tiers independently");
      console.log("Tier 2 winner:", escrowAccount.tiers[2].winner.toBase58());
      console.log("Tier 3 winner:", escrowAccount.tiers[3].winner.toBase58());
    });
  });

  describe("claim_prize", () => {
    let escrowPda: PublicKey;
    let vaultPda: PublicKey;
    let organizerForClaim: Keypair;
    let judgesForClaim: Keypair[];
    let winner1: Keypair;
    let winner2: Keypair;

    before(async () => {
      // Create fresh keypairs for claim tests
      organizerForClaim = Keypair.generate();
      judgesForClaim = [
        Keypair.generate(),
        Keypair.generate(),
        Keypair.generate(),
        Keypair.generate(),
        Keypair.generate(),
      ];
      winner1 = Keypair.generate();
      winner2 = Keypair.generate();

      // Airdrop SOL to organizer
      const airdropSig = await provider.connection.requestAirdrop(
        organizerForClaim.publicKey,
        100 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Derive PDAs
      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizerForClaim.publicKey.toBuffer()],
        program.programId,
      );

      [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizerForClaim.publicKey.toBuffer()],
        program.programId,
      );

      // Initialize escrow
      const judges = judgesForClaim.map((j) => j.publicKey);
      const threshold = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      );

      await program.methods
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
        .accountsPartial({
          escrow: escrowPda,
          vault: vaultPda,
          organizer: organizerForClaim.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForClaim])
        .rpc();

      // Finalize winner for tier 0
      const signatures0: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(1) as any,
        Array(64).fill(2) as any,
        Array(64).fill(3) as any,
        Array(64).fill(0) as any,
        Array(64).fill(0) as any,
      ];

      await program.methods
        .finalizeWinner(0, winner1.publicKey, signatures0)
        .accountsPartial({
          escrow: escrowPda,
          organizer: organizerForClaim.publicKey,
        })
        .rpc();

      // Finalize winner for tier 1
      const signatures1: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ][] = [
        Array(64).fill(4) as any,
        Array(64).fill(5) as any,
        Array(64).fill(6) as any,
        Array(64).fill(0) as any,
        Array(64).fill(0) as any,
      ];

      await program.methods
        .finalizeWinner(1, winner2.publicKey, signatures1)
        .accountsPartial({
          escrow: escrowPda,
          organizer: organizerForClaim.publicKey,
        })
        .rpc();
    });

    it("Successfully claims prize as the designated winner", async () => {
      // Get balances before claim
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
      const winnerBalanceBefore = await provider.connection.getBalance(
        winner1.publicKey,
      );

      console.log(
        "Vault balance before:",
        vaultBalanceBefore / LAMPORTS_PER_SOL,
        "SOL",
      );
      console.log(
        "Winner balance before:",
        winnerBalanceBefore / LAMPORTS_PER_SOL,
        "SOL",
      );

      // Winner claims prize
      const tx = await program.methods
        .claimPrize(0)
        .accountsPartial({
          escrow: escrowPda,
          vault: vaultPda,
          winner: winner1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner1])
        .rpc();

      console.log("Claim prize transaction:", tx);

      // Get balances after claim
      const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
      const winnerBalanceAfter = await provider.connection.getBalance(
        winner1.publicKey,
      );

      console.log(
        "Vault balance after:",
        vaultBalanceAfter / LAMPORTS_PER_SOL,
        "SOL",
      );
      console.log(
        "Winner balance after:",
        winnerBalanceAfter / LAMPORTS_PER_SOL,
        "SOL",
      );

      // Verify vault balance decreased by prize amount
      const expectedDecrease = 20 * LAMPORTS_PER_SOL;
      assert.equal(
        vaultBalanceBefore - vaultBalanceAfter,
        expectedDecrease,
        "Vault should have decreased by 20 SOL",
      );

      // Verify winner balance increased (accounting for tx fees)
      const balanceIncrease = winnerBalanceAfter - winnerBalanceBefore;
      assert.isAbove(
        balanceIncrease,
        19 * LAMPORTS_PER_SOL,
        "Winner should have received approximately 20 SOL",
      );

      // Verify tier is marked as claimed
      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isTrue(
        escrowAccount.tiers[0].claimed,
        "Tier 0 should be marked as claimed",
      );

      console.log("Prize claimed successfully");
      console.log(
        "Winner received approximately",
        balanceIncrease / LAMPORTS_PER_SOL,
        "SOL",
      );
    });

    it("Fails to claim prize if not the winner", async () => {
      const impostor = Keypair.generate();

      // Airdrop to impostor for tx fees
      const airdropSig = await provider.connection.requestAirdrop(
        impostor.publicKey,
        1 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(airdropSig);

      try {
        await program.methods
          .claimPrize(1)
          .accountsPartial({
            escrow: escrowPda,
            vault: vaultPda,
            winner: impostor.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([impostor])
          .rpc();

        assert.fail("Should have failed - caller is not the winner");
      } catch (error) {
        assert.include(
          error.message,
          "Unauthorized",
          "Should fail with Unauthorized error",
        );
        console.log("Correctly rejected non-winner claim attempt");
      }
    });

    it("Fails to claim prize that was already claimed", async () => {
      try {
        await program.methods
          .claimPrize(0)
          .accountsPartial({
            escrow: escrowPda,
            vault: vaultPda,
            winner: winner1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([winner1])
          .rpc();

        assert.fail("Should have failed - prize already claimed");
      } catch (error) {
        assert.include(
          error.message,
          "TierAlreadyClaimed",
          "Should fail with TierAlreadyClaimed error",
        );
        console.log("Correctly rejected double claim attempt");
      }
    });

    it("Fails to claim prize for tier that has no winner set", async () => {
      // Create a new escrow with 3 tiers
      const newOrganizer = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        newOrganizer.publicKey,
        50 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(airdropSig);

      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );

      const [newVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );

      const judges = judgesForClaim.map((j) => j.publicKey);
      const tierAmounts = [
        new anchor.BN(10 * LAMPORTS_PER_SOL),
        new anchor.BN(5 * LAMPORTS_PER_SOL),
        new anchor.BN(3 * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      );

      await program.methods
        .initializeEscrow(judges, 3, tierAmounts, deadline)
        .accountsPartial({
          escrow: newEscrowPda,
          vault: newVaultPda,
          organizer: newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      // Try to claim tier 2 without finalizing winner
      const someWinner = Keypair.generate();
      const airdrop2 = await provider.connection.requestAirdrop(
        someWinner.publicKey,
        1 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(airdrop2);

      try {
        await program.methods
          .claimPrize(2)
          .accountsPartial({
            escrow: newEscrowPda,
            vault: newVaultPda,
            winner: someWinner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([someWinner])
          .rpc();

        assert.fail("Should have failed - winner not finalized");
      } catch (error) {
        assert.include(
          error.message,
          "NotFinalized",
          "Should fail with NotFinalized error",
        );
        console.log("Correctly rejected claim for unfinalized tier");
      }
    });

    it("Allows multiple different winners to claim their respective prizes", async () => {
      // Winner 2 claims their prize (tier 1)
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
      const winner2BalanceBefore = await provider.connection.getBalance(
        winner2.publicKey,
      );

      await program.methods
        .claimPrize(1)
        .accountsPartial({
          escrow: escrowPda,
          vault: vaultPda,
          winner: winner2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner2])
        .rpc();

      const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
      const winner2BalanceAfter = await provider.connection.getBalance(
        winner2.publicKey,
      );

      // Verify vault decreased by 15 SOL
      assert.equal(
        vaultBalanceBefore - vaultBalanceAfter,
        15 * LAMPORTS_PER_SOL,
        "Vault should decrease by 15 SOL",
      );

      // Verify winner2 received approximately 15 SOL
      const increase = winner2BalanceAfter - winner2BalanceBefore;
      assert.isAbove(
        increase,
        14 * LAMPORTS_PER_SOL,
        "Winner 2 should receive approximately 15 SOL",
      );

      // Verify both tiers are claimed
      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isTrue(escrowAccount.tiers[0].claimed, "Tier 0 should be claimed");
      assert.isTrue(escrowAccount.tiers[1].claimed, "Tier 1 should be claimed");

      console.log("Multiple winners claimed successfully");
      console.log("Winner 1 claimed tier 0: 20 SOL");
      console.log("Winner 2 claimed tier 1: 15 SOL");
    });
  });

  describe("refund_unclaimed (Chunk 4 - Not Implemented Yet)", () => {
    it("Should be implemented in Chunk 4", async () => {
      console.log("⏳ refund_unclaimed - Coming in Chunk 4");
    });
  });
});
