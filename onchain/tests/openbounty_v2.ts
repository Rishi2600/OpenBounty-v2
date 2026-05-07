import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

// HELPER — replaces ALL airdrops throughout the file
// Transfers SOL from a funded payer to any wallet
async function fund(
  provider: anchor.AnchorProvider,
  to: PublicKey,
  lamports: number,
  payer?: anchor.Wallet | Keypair,
) {
  const fromPubkey = payer ? payer.publicKey : provider.wallet.publicKey;
  const signers    = payer ? [payer] : [];

  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey, toPubkey: to, lamports })
  );

  await provider.sendAndConfirm(tx, signers as any);
}

type Sig64 = [
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number,
];

function mockSigs(fills: number[]): Sig64[] {
  return fills.map((v) => Array(64).fill(v) as Sig64);
}

describe("openbounty_v2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OpenbountyV2 as Program<OpenbountyV2>;

  // Top-level test accounts
  let organizer: Keypair;
  let judge1: Keypair;
  let judge2: Keypair;
  let judge3: Keypair;
  let judge4: Keypair;
  let judge5: Keypair;

  before(async () => {
    organizer = Keypair.generate();
    judge1    = Keypair.generate();
    judge2    = Keypair.generate();
    judge3    = Keypair.generate();
    judge4    = Keypair.generate();
    judge5    = Keypair.generate();

    await fund(provider, organizer.publicKey, 100 * LAMPORTS_PER_SOL);
  });

  // initialize_escrow — 8 tests
  describe("initialize_escrow", () => {

    it("Successfully initializes an escrow with valid parameters", async () => {
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer.publicKey.toBuffer()],
        program.programId,
      );

      const judges = [
        judge1.publicKey, judge2.publicKey, judge3.publicKey,
        judge4.publicKey, judge5.publicKey,
      ];
      const threshold   = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
        new anchor.BN(10 * LAMPORTS_PER_SOL),
        new anchor.BN(5  * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      const balanceBefore = await provider.connection.getBalance(organizer.publicKey);

      const tx = await program.methods
        .initializeEscrow(
          "ETHIndia 2024",
          "ipfs://QmExampleMetadataHash",
          judges,
          threshold,
          tierAmounts,
          deadline,
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizer])
        .rpc();

      console.log("Initialize escrow transaction:", tx);

      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.equal(escrowAccount.title,       "ETHIndia 2024",               "Title should match");
      assert.equal(escrowAccount.metadataUri, "ipfs://QmExampleMetadataHash", "Metadata URI should match");
      assert.equal(escrowAccount.organizer.toBase58(), organizer.publicKey.toBase58(), "Organizer should match");
      assert.equal(escrowAccount.judges.length, 5, "Should have 5 judges");
      assert.equal(escrowAccount.threshold,     3, "Threshold should be 3");
      assert.equal(escrowAccount.tiers.length,  4, "Should have 4 prize tiers");
      assert.equal(escrowAccount.deadline.toNumber(), deadline.toNumber(), "Deadline should match");

      for (let i = 0; i < judges.length; i++) {
        assert.equal(escrowAccount.judges[i].toBase58(), judges[i].toBase58(), `Judge ${i + 1} should match`);
      }

      assert.equal(escrowAccount.tiers[0].amount.toNumber(), 20 * LAMPORTS_PER_SOL, "Tier 0 should be 20 SOL");
      assert.equal(escrowAccount.tiers[1].amount.toNumber(), 15 * LAMPORTS_PER_SOL, "Tier 1 should be 15 SOL");
      assert.equal(escrowAccount.tiers[2].amount.toNumber(), 10 * LAMPORTS_PER_SOL, "Tier 2 should be 10 SOL");
      assert.equal(escrowAccount.tiers[3].amount.toNumber(),  5 * LAMPORTS_PER_SOL, "Tier 3 should be 5 SOL");

      escrowAccount.tiers.forEach((tier, index) => {
        assert.isNull(tier.winner,   `Tier ${index} should have no winner yet`);
        assert.isFalse(tier.claimed, `Tier ${index} should be unclaimed`);
      });

      const vaultBalance  = await provider.connection.getBalance(vaultPda);
      const expectedTotal = 50 * LAMPORTS_PER_SOL;
      assert.equal(vaultBalance, expectedTotal, "Vault should have 50 SOL locked");

      const balanceAfter = await provider.connection.getBalance(organizer.publicKey);
      assert.isAbove(balanceBefore - balanceAfter, expectedTotal, "Organizer should have transferred at least 50 SOL");

      console.log("Escrow initialized successfully!");
      console.log(`   Title: ${escrowAccount.title}`);
      console.log(`   Metadata URI: ${escrowAccount.metadataUri}`);
      console.log(`   Organizer: ${escrowAccount.organizer.toBase58()}`);
      console.log(`   Judges: ${escrowAccount.judges.length}`);
      console.log(`   Threshold: ${escrowAccount.threshold}`);
      console.log(`   Tiers: ${escrowAccount.tiers.length}`);
      console.log(`   Total locked: ${vaultBalance / LAMPORTS_PER_SOL} SOL`);
    });

    it("Succeeds with an empty metadata_uri (field is optional)", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), org.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), org.publicKey.toBuffer()],
        program.programId,
      );

      await program.methods
        .initializeEscrow(
          "Solo Bounty",
          "",   // empty metadata_uri — should be accepted
          [judge1.publicKey, judge2.publicKey],
          2,
          [new anchor.BN(1 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     org.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([org])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.equal(escrowAccount.title,       "Solo Bounty", "Title should match");
      assert.equal(escrowAccount.metadataUri, "",            "Metadata URI should be empty string");

      console.log("Correctly accepted empty metadata_uri");
    });

    it("Fails to initialize with an empty title", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), org.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), org.publicKey.toBuffer()],
        program.programId,
      );

      try {
        await program.methods
          .initializeEscrow(
            "",   // empty title — should be rejected
            "",
            [judge1.publicKey],
            1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          )
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();

        assert.fail("Should have failed with empty title");
      } catch (error) {
        assert.include(error.message, "InvalidTitle", "Should fail with InvalidTitle error");
        console.log("Correctly rejected empty title");
      }
    });

    it("Fails to initialize with a title exceeding 50 characters", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), org.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), org.publicKey.toBuffer()],
        program.programId,
      );

      try {
        await program.methods
          .initializeEscrow(
            "A".repeat(51),   // 51 chars — should be rejected
            "",
            [judge1.publicKey],
            1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          )
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();

        assert.fail("Should have failed with title too long");
      } catch (error) {
        assert.include(error.message, "InvalidTitle", "Should fail with InvalidTitle error");
        console.log("Correctly rejected title exceeding 50 characters");
      }
    });

    it("Fails to initialize with a metadata_uri exceeding 100 characters", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), org.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), org.publicKey.toBuffer()],
        program.programId,
      );

      try {
        await program.methods
          .initializeEscrow(
            "Valid Title",
            "x".repeat(101),   // 101 chars — should be rejected
            [judge1.publicKey],
            1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          )
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();

        assert.fail("Should have failed with metadata_uri too long");
      } catch (error) {
        assert.include(error.message, "InvalidMetadataUri", "Should fail with InvalidMetadataUri error");
        console.log("Correctly rejected metadata_uri exceeding 100 characters");
      }
    });

    it("Fails to initialize with invalid threshold (too high)", async () => {
      const organizer2 = Keypair.generate();
      await fund(provider, organizer2.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer2.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer2.publicKey.toBuffer()],
        program.programId,
      );

      const judges           = [judge1.publicKey, judge2.publicKey, judge3.publicKey];
      const invalidThreshold = 5;
      const tierAmounts      = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const deadline         = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .initializeEscrow("Threshold Test", "", judges, invalidThreshold, tierAmounts, deadline)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     organizer2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([organizer2])
          .rpc();

        assert.fail("Should have failed with invalid threshold");
      } catch (error) {
        assert.include(error.message, "InvalidThreshold", "Should fail with InvalidThreshold error");
        console.log("Correctly rejected invalid threshold");
      }
    });

    it("Fails to initialize with past deadline", async () => {
      const organizer3 = Keypair.generate();
      await fund(provider, organizer3.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer3.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer3.publicKey.toBuffer()],
        program.programId,
      );

      const judges      = [judge1.publicKey, judge2.publicKey];
      const threshold   = 2;
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const pastDeadline = new anchor.BN(Math.floor(Date.now() / 1000) - 3600);

      try {
        await program.methods
          .initializeEscrow("Deadline Test", "", judges, threshold, tierAmounts, pastDeadline)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     organizer3.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([organizer3])
          .rpc();

        assert.fail("Should have failed with invalid deadline");
      } catch (error) {
        assert.include(error.message, "InvalidDeadline", "Should fail with InvalidDeadline error");
        console.log("Correctly rejected past deadline");
      }
    });

    it("Fails to initialize with no judges", async () => {
      const organizer4 = Keypair.generate();
      await fund(provider, organizer4.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizer4.publicKey.toBuffer()],
        program.programId,
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizer4.publicKey.toBuffer()],
        program.programId,
      );

      const emptyJudges = [];
      const threshold   = 1;
      const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
      const deadline    = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .initializeEscrow("No Judges Test", "", emptyJudges, threshold, tierAmounts, deadline)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     organizer4.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([organizer4])
          .rpc();

        assert.fail("Should have failed with no judges");
      } catch (error) {
        assert.include(error.message, "NoJudges", "Should fail with NoJudges error");
        console.log("Correctly rejected empty judge list");
      }
    });
  });

  // finalize_winner — 5 tests
  describe("finalize_winner", () => {

    let escrowPda:            PublicKey;
    let vaultPda:             PublicKey;
    let organizerForFinalize: Keypair;
    let judgesForFinalize:    Keypair[];

    before(async () => {
      organizerForFinalize = Keypair.generate();
      judgesForFinalize    = Array.from({ length: 5 }, () => Keypair.generate());

      await fund(provider, organizerForFinalize.publicKey, 100 * LAMPORTS_PER_SOL);

      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizerForFinalize.publicKey.toBuffer()],
        program.programId,
      );
      [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizerForFinalize.publicKey.toBuffer()],
        program.programId,
      );

      const judges      = judgesForFinalize.map((j) => j.publicKey);
      const threshold   = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
        new anchor.BN(10 * LAMPORTS_PER_SOL),
        new anchor.BN(5  * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      await program.methods
        .initializeEscrow(
          "Finalize Test Bounty",
          "",
          judges,
          threshold,
          tierAmounts,
          deadline,
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForFinalize.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForFinalize])
        .rpc();
    });

    it("Successfully finalizes winner with valid signatures (3 of 5)", async () => {
      const winner = Keypair.generate();
      const tier   = 0;

      const message = `tier:${tier},winner:${winner.publicKey.toBase58()}`;
      console.log("Message to sign:", message);

      const signatures = mockSigs([1, 2, 3, 0, 0]);

      const tx = await program.methods
        .finalizeWinner(tier, winner.publicKey, signatures)
        .accounts({
          escrow:    escrowPda,
          organizer: organizerForFinalize.publicKey,
        })
        .rpc();

      console.log("Finalize winner transaction:", tx);

      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.isNotNull(escrowAccount.tiers[tier].winner, "Winner should be set");
      assert.equal(
        escrowAccount.tiers[tier].winner.toBase58(),
        winner.publicKey.toBase58(),
        "Winner should match",
      );
      assert.isFalse(escrowAccount.tiers[tier].claimed, "Tier should not be claimed yet");

      console.log("Winner finalized successfully for tier", tier);
      console.log("Winner address:", escrowAccount.tiers[tier].winner.toBase58());
    });

    it("Fails to finalize with insufficient signatures (only 2 of 5)", async () => {
      const winner     = Keypair.generate();
      const tier       = 1;
      const signatures = mockSigs([1, 2, 0, 0, 0]); // only 2

      try {
        await program.methods
          .finalizeWinner(tier, winner.publicKey, signatures)
          .accounts({
            escrow:    escrowPda,
            organizer: organizerForFinalize.publicKey,
          })
          .rpc();

        assert.fail("Should have failed with insufficient signatures");
      } catch (error) {
        assert.include(error.message, "InsufficientSignatures", "Should fail with InsufficientSignatures error");
        console.log("Correctly rejected insufficient signatures");
      }
    });

    it("Fails to finalize already finalized tier", async () => {
      const anotherWinner = Keypair.generate();
      const tier          = 0; // Already finalized in first test
      const signatures    = mockSigs([1, 2, 3, 0, 0]);

      try {
        await program.methods
          .finalizeWinner(tier, anotherWinner.publicKey, signatures)
          .accounts({
            escrow:    escrowPda,
            organizer: organizerForFinalize.publicKey,
          })
          .rpc();

        assert.fail("Should have failed - tier already finalized");
      } catch (error) {
        assert.include(error.message, "AlreadyFinalized", "Should fail with AlreadyFinalized error");
        console.log("Correctly rejected already finalized tier");
      }
    });

    it("Fails to finalize with invalid tier index", async () => {
      const winner      = Keypair.generate();
      const invalidTier = 10;
      const signatures  = mockSigs([1, 2, 3, 0, 0]);

      try {
        await program.methods
          .finalizeWinner(invalidTier, winner.publicKey, signatures)
          .accounts({
            escrow:    escrowPda,
            organizer: organizerForFinalize.publicKey,
          })
          .rpc();

        assert.fail("Should have failed with invalid tier");
      } catch (error) {
        assert.include(error.message, "InvalidTier", "Should fail with InvalidTier error");
        console.log("Correctly rejected invalid tier index");
      }
    });

    it("Can finalize multiple different tiers independently", async () => {
      const winner2 = Keypair.generate();
      const winner3 = Keypair.generate();

      await program.methods
        .finalizeWinner(2, winner2.publicKey, mockSigs([1, 2, 3, 0, 0]))
        .accounts({ escrow: escrowPda, organizer: organizerForFinalize.publicKey })
        .rpc();

      await program.methods
        .finalizeWinner(3, winner3.publicKey, mockSigs([4, 5, 6, 0, 0]))
        .accounts({ escrow: escrowPda, organizer: organizerForFinalize.publicKey })
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.equal(escrowAccount.tiers[2].winner.toBase58(), winner2.publicKey.toBase58(), "Tier 2 winner should match");
      assert.equal(escrowAccount.tiers[3].winner.toBase58(), winner3.publicKey.toBase58(), "Tier 3 winner should match");

      console.log("Successfully finalized multiple tiers independently");
      console.log("Tier 2 winner:", escrowAccount.tiers[2].winner.toBase58());
      console.log("Tier 3 winner:", escrowAccount.tiers[3].winner.toBase58());
    });
  });

  // claim_prize — 5 tests
  describe("claim_prize", () => {

    let escrowPda:         PublicKey;
    let vaultPda:          PublicKey;
    let organizerForClaim: Keypair;
    let judgesForClaim:    Keypair[];
    let winner1:           Keypair;
    let winner2:           Keypair;

    before(async () => {
      organizerForClaim = Keypair.generate();
      judgesForClaim    = Array.from({ length: 5 }, () => Keypair.generate());
      winner1           = Keypair.generate();
      winner2           = Keypair.generate();

      await fund(provider, organizerForClaim.publicKey, 100 * LAMPORTS_PER_SOL);

      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizerForClaim.publicKey.toBuffer()],
        program.programId,
      );
      [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizerForClaim.publicKey.toBuffer()],
        program.programId,
      );

      const judges      = judgesForClaim.map((j) => j.publicKey);
      const threshold   = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      await program.methods
        .initializeEscrow(
          "Claim Test Bounty",
          "",
          judges,
          threshold,
          tierAmounts,
          deadline,
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForClaim.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForClaim])
        .rpc();

      await program.methods
        .finalizeWinner(0, winner1.publicKey, mockSigs([1, 2, 3, 0, 0]))
        .accountsPartial({ escrow: escrowPda, organizer: organizerForClaim.publicKey })
        .rpc();

      await program.methods
        .finalizeWinner(1, winner2.publicKey, mockSigs([4, 5, 6, 0, 0]))
        .accountsPartial({ escrow: escrowPda, organizer: organizerForClaim.publicKey })
        .rpc();
    });

    it("Successfully claims prize as the designated winner", async () => {
      const vaultBalanceBefore  = await provider.connection.getBalance(vaultPda);
      const winnerBalanceBefore = await provider.connection.getBalance(winner1.publicKey);

      console.log("Vault balance before:",  vaultBalanceBefore  / LAMPORTS_PER_SOL, "SOL");
      console.log("Winner balance before:", winnerBalanceBefore / LAMPORTS_PER_SOL, "SOL");

      const tx = await program.methods
        .claimPrize(0)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          winner:        winner1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner1])
        .rpc();

      console.log("Claim prize transaction:", tx);

      const vaultBalanceAfter  = await provider.connection.getBalance(vaultPda);
      const winnerBalanceAfter = await provider.connection.getBalance(winner1.publicKey);

      console.log("Vault balance after:",  vaultBalanceAfter  / LAMPORTS_PER_SOL, "SOL");
      console.log("Winner balance after:", winnerBalanceAfter / LAMPORTS_PER_SOL, "SOL");

      assert.equal(vaultBalanceBefore - vaultBalanceAfter, 20 * LAMPORTS_PER_SOL, "Vault should decrease by 20 SOL");

      const balanceIncrease = winnerBalanceAfter - winnerBalanceBefore;
      assert.isAbove(balanceIncrease, 19 * LAMPORTS_PER_SOL, "Winner should receive approximately 20 SOL");

      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isTrue(escrowAccount.tiers[0].claimed, "Tier 0 should be marked as claimed");

      console.log("Prize claimed successfully");
      console.log("Winner received approximately", balanceIncrease / LAMPORTS_PER_SOL, "SOL");
    });

    it("Fails to claim prize if not the winner", async () => {
      const impostor = Keypair.generate();
      await fund(provider, impostor.publicKey, 1 * LAMPORTS_PER_SOL, organizerForClaim);

      try {
        await program.methods
          .claimPrize(1)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            winner:        impostor.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([impostor])
          .rpc();

        assert.fail("Should have failed - caller is not the winner");
      } catch (error) {
        assert.include(error.message, "Unauthorized", "Should fail with Unauthorized error");
        console.log("Correctly rejected non-winner claim attempt");
      }
    });

    it("Fails to claim prize that was already claimed", async () => {
      try {
        await program.methods
          .claimPrize(0)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            winner:        winner1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([winner1])
          .rpc();

        assert.fail("Should have failed - prize already claimed");
      } catch (error) {
        assert.include(error.message, "TierAlreadyClaimed", "Should fail with TierAlreadyClaimed error");
        console.log("Correctly rejected double claim attempt");
      }
    });

    it("Fails to claim prize for tier that has no winner set", async () => {
      const newOrganizer = Keypair.generate();
      await fund(provider, newOrganizer.publicKey, 50 * LAMPORTS_PER_SOL);

      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );
      const [newVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );

      const judges      = judgesForClaim.map((j) => j.publicKey);
      const tierAmounts = [
        new anchor.BN(10 * LAMPORTS_PER_SOL),
        new anchor.BN(5  * LAMPORTS_PER_SOL),
        new anchor.BN(3  * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      await program.methods
        .initializeEscrow(
          "Unfinalized Test",
          "",
          judges,
          3,
          tierAmounts,
          deadline,
        )
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          organizer:     newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      const someWinner = Keypair.generate();
      await fund(provider, someWinner.publicKey, 1 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .claimPrize(2)
          .accountsPartial({
            escrow:        newEscrowPda,
            vault:         newVaultPda,
            winner:        someWinner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([someWinner])
          .rpc();

        assert.fail("Should have failed - winner not finalized");
      } catch (error) {
        assert.include(error.message, "NotFinalized", "Should fail with NotFinalized error");
        console.log("Correctly rejected claim for unfinalized tier");
      }
    });

    it("Allows multiple different winners to claim their respective prizes", async () => {
      const vaultBalanceBefore   = await provider.connection.getBalance(vaultPda);
      const winner2BalanceBefore = await provider.connection.getBalance(winner2.publicKey);

      await program.methods
        .claimPrize(1)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          winner:        winner2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner2])
        .rpc();

      const vaultBalanceAfter   = await provider.connection.getBalance(vaultPda);
      const winner2BalanceAfter = await provider.connection.getBalance(winner2.publicKey);

      assert.equal(vaultBalanceBefore - vaultBalanceAfter, 15 * LAMPORTS_PER_SOL, "Vault should decrease by 15 SOL");

      const increase = winner2BalanceAfter - winner2BalanceBefore;
      assert.isAbove(increase, 14 * LAMPORTS_PER_SOL, "Winner 2 should receive approximately 15 SOL");

      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isTrue(escrowAccount.tiers[0].claimed, "Tier 0 should be claimed");
      assert.isTrue(escrowAccount.tiers[1].claimed, "Tier 1 should be claimed");

      console.log("Multiple winners claimed successfully");
      console.log("Winner 1 claimed tier 0: 20 SOL");
      console.log("Winner 2 claimed tier 1: 15 SOL");
    });
  });

  // refund_unclaimed — 5 tests
  describe("refund_unclaimed", () => {

    let escrowPda:          PublicKey;
    let vaultPda:           PublicKey;
    let organizerForRefund: Keypair;
    let judgesForRefund:    Keypair[];
    let winner1:            Keypair;

    before(async () => {
      organizerForRefund = Keypair.generate();
      judgesForRefund    = Array.from({ length: 5 }, () => Keypair.generate());
      winner1            = Keypair.generate();

      await fund(provider, organizerForRefund.publicKey, 100 * LAMPORTS_PER_SOL);

      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), organizerForRefund.publicKey.toBuffer()],
        program.programId,
      );
      [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), organizerForRefund.publicKey.toBuffer()],
        program.programId,
      );

      const judges      = judgesForRefund.map((j) => j.publicKey);
      const threshold   = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
        new anchor.BN(10 * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 1); // 1 second

      await program.methods
        .initializeEscrow(
          "Refund Test Bounty",
          "",
          judges,
          threshold,
          tierAmounts,
          deadline,
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForRefund.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForRefund])
        .rpc();

      // Finalize and claim tier 0 only — tiers 1 and 2 remain unclaimed
      await program.methods
        .finalizeWinner(0, winner1.publicKey, mockSigs([1, 2, 3, 0, 0]))
        .accountsPartial({ escrow: escrowPda, organizer: organizerForRefund.publicKey })
        .rpc();

      await program.methods
        .claimPrize(0)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          winner:        winner1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner1])
        .rpc();

      console.log("Waiting for deadline to pass...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it("Successfully refunds unclaimed prizes after deadline", async () => {
      const organizerBalanceBefore = await provider.connection.getBalance(organizerForRefund.publicKey);
      const vaultBalanceBefore     = await provider.connection.getBalance(vaultPda);

      console.log("Organizer balance before:", organizerBalanceBefore / LAMPORTS_PER_SOL, "SOL");
      console.log("Vault balance before:",     vaultBalanceBefore     / LAMPORTS_PER_SOL, "SOL");

      const tx = await program.methods
        .refundUnclaimed()
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForRefund.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForRefund])
        .rpc();

      console.log("Refund transaction:", tx);

      const organizerBalanceAfter = await provider.connection.getBalance(organizerForRefund.publicKey);
      const vaultBalanceAfter     = await provider.connection.getBalance(vaultPda);

      console.log("Organizer balance after:", organizerBalanceAfter / LAMPORTS_PER_SOL, "SOL");
      console.log("Vault balance after:",     vaultBalanceAfter     / LAMPORTS_PER_SOL, "SOL");

      const expectedRefund = 25 * LAMPORTS_PER_SOL; // tier 1 (15) + tier 2 (10)
      const actualRefund   = vaultBalanceBefore - vaultBalanceAfter;

      assert.equal(actualRefund, expectedRefund, "Vault should decrease by 25 SOL (unclaimed tiers)");

      const balanceIncrease = organizerBalanceAfter - organizerBalanceBefore;
      assert.isAbove(balanceIncrease, 24 * LAMPORTS_PER_SOL, "Organizer should receive approximately 25 SOL");

      console.log("Refund successful");
      console.log("Refunded amount:", actualRefund / LAMPORTS_PER_SOL, "SOL");
    });

    it("Fails to refund before deadline passes", async () => {
      const newOrganizer = Keypair.generate();
      await fund(provider, newOrganizer.publicKey, 50 * LAMPORTS_PER_SOL);

      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );
      const [newVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );

      const judges         = judgesForRefund.map((j) => j.publicKey);
      const tierAmounts    = [new anchor.BN(10 * LAMPORTS_PER_SOL)];
      const futureDeadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      await program.methods
        .initializeEscrow(
          "Pre-Deadline Test",
          "",
          judges,
          3,
          tierAmounts,
          futureDeadline,
        )
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          organizer:     newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      try {
        await program.methods
          .refundUnclaimed()
          .accountsPartial({
            escrow:        newEscrowPda,
            vault:         newVaultPda,
            organizer:     newOrganizer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newOrganizer])
          .rpc();

        assert.fail("Should have failed - deadline not passed");
      } catch (error) {
        assert.include(error.message, "DeadlineNotPassed", "Should fail with DeadlineNotPassed error");
        console.log("Correctly rejected refund before deadline");
      }
    });

    it("Fails when non-organizer tries to refund", async () => {
      const impostor = Keypair.generate();
      await fund(provider, impostor.publicKey, 1 * LAMPORTS_PER_SOL, organizerForRefund);

      try {
        await program.methods
          .refundUnclaimed()
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            organizer:     impostor.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([impostor])
          .rpc();

        assert.fail("Should have failed - caller is not organizer");
      } catch (error) {
        assert.include(error.message, "Unauthorized", "Should fail with Unauthorized error");
        console.log("Correctly rejected non-organizer refund attempt");
      }
    });

    it("Fails when all prizes are already claimed (nothing to refund)", async () => {
      const newOrganizer = Keypair.generate();
      await fund(provider, newOrganizer.publicKey, 50 * LAMPORTS_PER_SOL);

      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );
      const [newVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );

      const judges        = judgesForRefund.map((j) => j.publicKey);
      const tierAmounts   = [new anchor.BN(10 * LAMPORTS_PER_SOL)];
      const shortDeadline = new anchor.BN(Math.floor(Date.now() / 1000) + 1);

      await program.methods
        .initializeEscrow(
          "All Claimed Test",
          "",
          judges,
          3,
          tierAmounts,
          shortDeadline,
        )
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          organizer:     newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      const someWinner = Keypair.generate();

      await program.methods
        .finalizeWinner(0, someWinner.publicKey, mockSigs([1, 2, 3, 0, 0]))
        .accountsPartial({ escrow: newEscrowPda, organizer: newOrganizer.publicKey })
        .rpc();

      await program.methods
        .claimPrize(0)
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          winner:        someWinner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([someWinner])
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        await program.methods
          .refundUnclaimed()
          .accountsPartial({
            escrow:        newEscrowPda,
            vault:         newVaultPda,
            organizer:     newOrganizer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newOrganizer])
          .rpc();

        assert.fail("Should have failed - no unclaimed funds");
      } catch (error) {
        assert.include(error.message, "NoUnclaimedFunds", "Should fail with NoUnclaimedFunds error");
        console.log("Correctly rejected refund when all prizes claimed");
      }
    });

    it("Correctly calculates partial refund (some claimed, some unclaimed)", async () => {
      const newOrganizer = Keypair.generate();
      await fund(provider, newOrganizer.publicKey, 100 * LAMPORTS_PER_SOL);

      const [newEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );
      const [newVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
        program.programId,
      );

      const judges      = judgesForRefund.map((j) => j.publicKey);
      const tierAmounts = [
        new anchor.BN(30 * LAMPORTS_PER_SOL),
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(10 * LAMPORTS_PER_SOL),
      ];
      const shortDeadline = new anchor.BN(Math.floor(Date.now() / 1000) + 1);

      await program.methods
        .initializeEscrow(
          "Partial Refund Test",
          "",
          judges,
          3,
          tierAmounts,
          shortDeadline,
        )
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          organizer:     newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      const winner = Keypair.generate();

      await program.methods
        .finalizeWinner(0, winner.publicKey, mockSigs([1, 2, 3, 0, 0]))
        .accountsPartial({ escrow: newEscrowPda, organizer: newOrganizer.publicKey })
        .rpc();

      await program.methods
        .claimPrize(0)
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          winner:        winner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const vaultBalanceBefore = await provider.connection.getBalance(newVaultPda);

      await program.methods
        .refundUnclaimed()
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          organizer:     newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      const vaultBalanceAfter = await provider.connection.getBalance(newVaultPda);
      const refunded          = vaultBalanceBefore - vaultBalanceAfter;

      assert.equal(refunded, 30 * LAMPORTS_PER_SOL, "Should refund exactly 30 SOL (tier 1 + tier 2)");

      console.log("Partial refund successful");
      console.log("Tier 0: Claimed (30 SOL)");
      console.log("Tier 1 + 2: Refunded (30 SOL)");
    });
  });
});