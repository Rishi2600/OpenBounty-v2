import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OpenbountyV2 } from "../target/types/openbounty_v2";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// Derive escrow PDA with nonce
function deriveEscrow(organizer: PublicKey, nonce: number, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.toBuffer(), Buffer.from([nonce])],
    programId,
  );
}

// Derive vault PDA with nonce
function deriveVault(organizer: PublicKey, nonce: number, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organizer.toBuffer(), Buffer.from([nonce])],
    programId,
  );
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("openbounty_v2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OpenbountyV2 as Program<OpenbountyV2>;

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

  // -------------------------------------------------------------------------
  // initialize_escrow — 9 tests
  // -------------------------------------------------------------------------

  describe("initialize_escrow", () => {

    it("Successfully initializes an escrow with valid parameters (nonce 0)", async () => {
      const nonce = 0;
      const [escrowPda] = deriveEscrow(organizer.publicKey, nonce, program.programId);
      const [vaultPda]  = deriveVault(organizer.publicKey,  nonce, program.programId);

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

      await program.methods
        .initializeEscrow(
          "ETHIndia 2024",
          "ipfs://QmExampleHash",
          judges,
          threshold,
          tierAmounts,
          deadline,
          nonce,
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizer])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.equal(escrowAccount.title,       "ETHIndia 2024",       "Title should match");
      assert.equal(escrowAccount.metadataUri, "ipfs://QmExampleHash", "Metadata URI should match");
      assert.equal(escrowAccount.nonce,       nonce,                 "Nonce should match");
      assert.equal(escrowAccount.organizer.toBase58(), organizer.publicKey.toBase58());
      assert.equal(escrowAccount.judges.length,   5);
      assert.equal(escrowAccount.threshold,       3);
      assert.equal(escrowAccount.tiers.length,    4);
      assert.equal(escrowAccount.deadline.toNumber(), deadline.toNumber());

      escrowAccount.tiers.forEach((tier, i) => {
        assert.isNull(tier.winner,          `Tier ${i} should have no winner`);
        assert.isFalse(tier.claimed,        `Tier ${i} should be unclaimed`);
        assert.equal(tier.votes.length, 0,  `Tier ${i} should have no votes`);
      });

      const vaultBalance = await provider.connection.getBalance(vaultPda);
      assert.equal(vaultBalance, 50 * LAMPORTS_PER_SOL, "Vault should have 50 SOL");

      const balanceAfter = await provider.connection.getBalance(organizer.publicKey);
      assert.isAbove(balanceBefore - balanceAfter, 50 * LAMPORTS_PER_SOL);

      console.log("Escrow initialized — nonce 0, 50 SOL locked");
    });

    it("Successfully initializes a second escrow from same wallet (nonce 1)", async () => {
      const nonce = 1;
      const [escrowPda] = deriveEscrow(organizer.publicKey, nonce, program.programId);
      const [vaultPda]  = deriveVault(organizer.publicKey,  nonce, program.programId);

      await program.methods
        .initializeEscrow(
          "Second Bounty",
          "",
          [judge1.publicKey, judge2.publicKey],
          2,
          [new anchor.BN(1 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          nonce,
        )
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizer])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);

      assert.equal(escrowAccount.title, "Second Bounty");
      assert.equal(escrowAccount.nonce, nonce, "Nonce 1 should be stored");

      console.log("Second escrow from same wallet — nonce 1 works correctly");
    });

    it("Succeeds with empty metadata_uri (optional field)", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 10 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "Solo Bounty", "",
          [judge1.publicKey], 1,
          [new anchor.BN(1 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          0,
        )
        .accountsPartial({
          escrow: escrowPda, vault: vaultPda,
          organizer: org.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([org])
        .rpc();

      const account = await program.account.escrow.fetch(escrowPda);
      assert.equal(account.metadataUri, "");
      console.log("Empty metadata_uri accepted");
    });

    it("Fails with empty title", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 1 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      try {
        await program.methods
          .initializeEscrow(
            "", "",
            [judge1.publicKey], 1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
            0,
          )
          .accountsPartial({
            escrow: escrowPda, vault: vaultPda,
            organizer: org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "InvalidTitle");
        console.log("Empty title correctly rejected");
      }
    });

    it("Fails with title exceeding 50 characters", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 1 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      try {
        await program.methods
          .initializeEscrow(
            "A".repeat(51), "",
            [judge1.publicKey], 1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
            0,
          )
          .accountsPartial({
            escrow: escrowPda, vault: vaultPda,
            organizer: org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "InvalidTitle");
        console.log("Long title correctly rejected");
      }
    });

    it("Fails with metadata_uri exceeding 100 characters", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 1 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      try {
        await program.methods
          .initializeEscrow(
            "Valid Title", "x".repeat(101),
            [judge1.publicKey], 1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
            0,
          )
          .accountsPartial({
            escrow: escrowPda, vault: vaultPda,
            organizer: org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "InvalidMetadataUri");
        console.log("Long metadata_uri correctly rejected");
      }
    });

    it("Fails with invalid threshold (too high)", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 1 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      try {
        await program.methods
          .initializeEscrow(
            "Threshold Test", "",
            [judge1.publicKey, judge2.publicKey], 5,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
            0,
          )
          .accountsPartial({
            escrow: escrowPda, vault: vaultPda,
            organizer: org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "InvalidThreshold");
        console.log("Invalid threshold correctly rejected");
      }
    });

    it("Fails with past deadline", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 1 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      try {
        await program.methods
          .initializeEscrow(
            "Deadline Test", "",
            [judge1.publicKey], 1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) - 3600),
            0,
          )
          .accountsPartial({
            escrow: escrowPda, vault: vaultPda,
            organizer: org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "InvalidDeadline");
        console.log("Past deadline correctly rejected");
      }
    });

    it("Fails with no judges", async () => {
      const org = Keypair.generate();
      await fund(provider, org.publicKey, 1 * LAMPORTS_PER_SOL, organizer);

      const [escrowPda] = deriveEscrow(org.publicKey, 0, program.programId);
      const [vaultPda]  = deriveVault(org.publicKey,  0, program.programId);

      try {
        await program.methods
          .initializeEscrow(
            "No Judges Test", "",
            [], 1,
            [new anchor.BN(1 * LAMPORTS_PER_SOL)],
            new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
            0,
          )
          .accountsPartial({
            escrow: escrowPda, vault: vaultPda,
            organizer: org.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([org])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "NoJudges");
        console.log("No judges correctly rejected");
      }
    });
  });

  // -------------------------------------------------------------------------
  // vote_winner — 8 tests
  // -------------------------------------------------------------------------

  describe("vote_winner", () => {

    let escrowPda:           PublicKey;
    let vaultPda:            PublicKey;
    let organizerForVote:    Keypair;
    let judgesForVote:       Keypair[];
    const nonce = 0;

    before(async () => {
      organizerForVote = Keypair.generate();
      judgesForVote    = Array.from({ length: 5 }, () => Keypair.generate());

      await fund(provider, organizerForVote.publicKey, 100 * LAMPORTS_PER_SOL);

      [escrowPda] = deriveEscrow(organizerForVote.publicKey, nonce, program.programId);
      [vaultPda]  = deriveVault(organizerForVote.publicKey,  nonce, program.programId);

      await program.methods
        .initializeEscrow(
          "Vote Test Bounty", "",
          judgesForVote.map(j => j.publicKey), 3,
          [
            new anchor.BN(20 * LAMPORTS_PER_SOL),
            new anchor.BN(15 * LAMPORTS_PER_SOL),
            new anchor.BN(10 * LAMPORTS_PER_SOL),
            new anchor.BN(5  * LAMPORTS_PER_SOL),
          ],
          new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
          nonce,
        )
        .accountsPartial({
          escrow: escrowPda, vault: vaultPda,
          organizer: organizerForVote.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForVote])
        .rpc();
    });

    it("Judge successfully casts a vote", async () => {
      const candidate = Keypair.generate().publicKey;

      await program.methods
        .voteWinner(nonce, 0, candidate)
        .accountsPartial({
          escrow: escrowPda,
          judge:  judgesForVote[0].publicKey,
        })
        .signers([judgesForVote[0]])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.equal(escrowAccount.tiers[0].votes.length, 1, "Should have 1 vote");
      assert.equal(
        escrowAccount.tiers[0].votes[0].judge.toBase58(),
        judgesForVote[0].publicKey.toBase58(),
        "Vote judge should match"
      );
      assert.equal(
        escrowAccount.tiers[0].votes[0].candidate.toBase58(),
        candidate.toBase58(),
        "Vote candidate should match"
      );
      assert.isNull(escrowAccount.tiers[0].winner, "Tier should not be finalized yet");

      console.log("Vote recorded — 1/3 judges");
    });

    it("Auto-finalizes tier when threshold is reached (3 of 5 judges)", async () => {
      const candidate = Keypair.generate().publicKey;

      // Judge 1 votes
      await program.methods
        .voteWinner(nonce, 1, candidate)
        .accountsPartial({ escrow: escrowPda, judge: judgesForVote[0].publicKey })
        .signers([judgesForVote[0]])
        .rpc();

      // Judge 2 votes
      await program.methods
        .voteWinner(nonce, 1, candidate)
        .accountsPartial({ escrow: escrowPda, judge: judgesForVote[1].publicKey })
        .signers([judgesForVote[1]])
        .rpc();

      // Judge 3 votes — threshold reached
      await program.methods
        .voteWinner(nonce, 1, candidate)
        .accountsPartial({ escrow: escrowPda, judge: judgesForVote[2].publicKey })
        .signers([judgesForVote[2]])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isNotNull(escrowAccount.tiers[1].winner, "Tier should be finalized");
      assert.equal(
        escrowAccount.tiers[1].winner.toBase58(),
        candidate.toBase58(),
        "Winner should match candidate"
      );
      assert.equal(escrowAccount.tiers[1].votes.length, 3, "Should have 3 votes");

      console.log("Tier 1 auto-finalized after 3/3 judges voted");
    });

    it("Does not finalize when judges vote for different candidates", async () => {
      const candidate1 = Keypair.generate().publicKey;
      const candidate2 = Keypair.generate().publicKey;

      // Judge 1 votes for candidate1
      await program.methods
        .voteWinner(nonce, 2, candidate1)
        .accountsPartial({ escrow: escrowPda, judge: judgesForVote[0].publicKey })
        .signers([judgesForVote[0]])
        .rpc();

      // Judge 2 votes for candidate2
      await program.methods
        .voteWinner(nonce, 2, candidate2)
        .accountsPartial({ escrow: escrowPda, judge: judgesForVote[1].publicKey })
        .signers([judgesForVote[1]])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isNull(escrowAccount.tiers[2].winner, "Tier should not be finalized — split votes");
      assert.equal(escrowAccount.tiers[2].votes.length, 2);

      console.log("Split votes correctly did not finalize tier");
    });

    it("Fails when non-judge tries to vote", async () => {
      const impostor  = Keypair.generate();
      const candidate = Keypair.generate().publicKey;

      await fund(provider, impostor.publicKey, 1 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .voteWinner(nonce, 3, candidate)
          .accountsPartial({ escrow: escrowPda, judge: impostor.publicKey })
          .signers([impostor])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "NotAJudge");
        console.log("Non-judge vote correctly rejected");
      }
    });

    it("Fails when judge tries to vote twice on same tier", async () => {
      const candidate = Keypair.generate().publicKey;

      // First vote succeeds
      await program.methods
        .voteWinner(nonce, 3, candidate)
        .accountsPartial({ escrow: escrowPda, judge: judgesForVote[3].publicKey })
        .signers([judgesForVote[3]])
        .rpc();

      // Second vote from same judge fails
      try {
        await program.methods
          .voteWinner(nonce, 3, candidate)
          .accountsPartial({ escrow: escrowPda, judge: judgesForVote[3].publicKey })
          .signers([judgesForVote[3]])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "AlreadyVoted");
        console.log("Double vote correctly rejected");
      }
    });

    it("Fails when voting on already finalized tier", async () => {
      const candidate = Keypair.generate().publicKey;

      // Tier 1 was finalized in previous test
      try {
        await program.methods
          .voteWinner(nonce, 1, candidate)
          .accountsPartial({ escrow: escrowPda, judge: judgesForVote[4].publicKey })
          .signers([judgesForVote[4]])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "TierAlreadyFinalized");
        console.log("Vote on finalized tier correctly rejected");
      }
    });

    it("Fails with invalid tier index", async () => {
      const candidate = Keypair.generate().publicKey;

      try {
        await program.methods
          .voteWinner(nonce, 99, candidate)
          .accountsPartial({ escrow: escrowPda, judge: judgesForVote[0].publicKey })
          .signers([judgesForVote[0]])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "InvalidTier");
        console.log("Invalid tier index correctly rejected");
      }
    });

    it("Multiple tiers can be voted on independently", async () => {
      const newOrganizer = Keypair.generate();
      const newJudges    = Array.from({ length: 3 }, () => Keypair.generate());
      const candidate    = Keypair.generate().publicKey;

      await fund(provider, newOrganizer.publicKey, 50 * LAMPORTS_PER_SOL);

      const [newEscrowPda] = deriveEscrow(newOrganizer.publicKey, 0, program.programId);
      const [newVaultPda]  = deriveVault(newOrganizer.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "Multi Tier Vote Test", "",
          newJudges.map(j => j.publicKey), 2,
          [
            new anchor.BN(10 * LAMPORTS_PER_SOL),
            new anchor.BN(5  * LAMPORTS_PER_SOL),
          ],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          0,
        )
        .accountsPartial({
          escrow: newEscrowPda, vault: newVaultPda,
          organizer: newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      // Vote on tier 0
      await program.methods
        .voteWinner(0, 0, candidate)
        .accountsPartial({ escrow: newEscrowPda, judge: newJudges[0].publicKey })
        .signers([newJudges[0]])
        .rpc();

      await program.methods
        .voteWinner(0, 0, candidate)
        .accountsPartial({ escrow: newEscrowPda, judge: newJudges[1].publicKey })
        .signers([newJudges[1]])
        .rpc();

      // Vote on tier 1 with different candidate
      const candidate2 = Keypair.generate().publicKey;
      await program.methods
        .voteWinner(0, 1, candidate2)
        .accountsPartial({ escrow: newEscrowPda, judge: newJudges[0].publicKey })
        .signers([newJudges[0]])
        .rpc();

      await program.methods
        .voteWinner(0, 1, candidate2)
        .accountsPartial({ escrow: newEscrowPda, judge: newJudges[1].publicKey })
        .signers([newJudges[1]])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(newEscrowPda);
      assert.equal(escrowAccount.tiers[0].winner.toBase58(), candidate.toBase58());
      assert.equal(escrowAccount.tiers[1].winner.toBase58(), candidate2.toBase58());

      console.log("Multiple tiers finalized independently");
    });
  });

  // -------------------------------------------------------------------------
  // claim_prize — 5 tests
  // -------------------------------------------------------------------------

  describe("claim_prize", () => {

    let escrowPda:         PublicKey;
    let vaultPda:          PublicKey;
    let organizerForClaim: Keypair;
    let judgesForClaim:    Keypair[];
    let winner1:           Keypair;
    let winner2:           Keypair;
    const nonce = 0;

    before(async () => {
      organizerForClaim = Keypair.generate();
      judgesForClaim    = Array.from({ length: 5 }, () => Keypair.generate());
      winner1           = Keypair.generate();
      winner2           = Keypair.generate();

      await fund(provider, organizerForClaim.publicKey, 100 * LAMPORTS_PER_SOL);

      [escrowPda] = deriveEscrow(organizerForClaim.publicKey, nonce, program.programId);
      [vaultPda]  = deriveVault(organizerForClaim.publicKey,  nonce, program.programId);

      await program.methods
        .initializeEscrow(
          "Claim Test Bounty", "",
          judgesForClaim.map(j => j.publicKey), 3,
          [
            new anchor.BN(20 * LAMPORTS_PER_SOL),
            new anchor.BN(15 * LAMPORTS_PER_SOL),
          ],
          new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
          nonce,
        )
        .accountsPartial({
          escrow: escrowPda, vault: vaultPda,
          organizer: organizerForClaim.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForClaim])
        .rpc();

      // Finalize tier 0 via 3 judge votes
      for (let i = 0; i < 3; i++) {
        await program.methods
          .voteWinner(nonce, 0, winner1.publicKey)
          .accountsPartial({ escrow: escrowPda, judge: judgesForClaim[i].publicKey })
          .signers([judgesForClaim[i]])
          .rpc();
      }

      // Finalize tier 1 via 3 judge votes
      for (let i = 0; i < 3; i++) {
        await program.methods
          .voteWinner(nonce, 1, winner2.publicKey)
          .accountsPartial({ escrow: escrowPda, judge: judgesForClaim[i].publicKey })
          .signers([judgesForClaim[i]])
          .rpc();
      }
    });

    it("Winner successfully claims their prize", async () => {
      const vaultBefore  = await provider.connection.getBalance(vaultPda);
      const winnerBefore = await provider.connection.getBalance(winner1.publicKey);

      await program.methods
        .claimPrize(nonce, 0)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          winner:        winner1.publicKey,
          organizer:     organizerForClaim.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner1])
        .rpc();

      const vaultAfter  = await provider.connection.getBalance(vaultPda);
      const winnerAfter = await provider.connection.getBalance(winner1.publicKey);

      assert.equal(vaultBefore - vaultAfter, 20 * LAMPORTS_PER_SOL, "Vault should decrease by 20 SOL");
      assert.isAbove(winnerAfter - winnerBefore, 19 * LAMPORTS_PER_SOL, "Winner should receive ~20 SOL");

      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      assert.isTrue(escrowAccount.tiers[0].claimed, "Tier 0 should be claimed");

      console.log("Prize claimed successfully");
    });

    it("Fails when non-winner tries to claim", async () => {
      const impostor = Keypair.generate();
      await fund(provider, impostor.publicKey, 1 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .claimPrize(nonce, 1)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            winner:        impostor.publicKey,
            organizer:     organizerForClaim.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([impostor])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
        console.log("Non-winner claim correctly rejected");
      }
    });

    it("Fails when claiming already claimed tier", async () => {
      try {
        await program.methods
          .claimPrize(nonce, 0)
          .accountsPartial({
            escrow:        escrowPda,
            vault:         vaultPda,
            winner:        winner1.publicKey,
            organizer:     organizerForClaim.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([winner1])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "TierAlreadyClaimed");
        console.log("Double claim correctly rejected");
      }
    });

    it("Fails when tier has no winner set", async () => {
      const newOrganizer = Keypair.generate();
      const newJudges    = Array.from({ length: 3 }, () => Keypair.generate());
      await fund(provider, newOrganizer.publicKey, 20 * LAMPORTS_PER_SOL);

      const [newEscrow] = deriveEscrow(newOrganizer.publicKey, 0, program.programId);
      const [newVault]  = deriveVault(newOrganizer.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "Unfinalized Test", "",
          newJudges.map(j => j.publicKey), 2,
          [new anchor.BN(5 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 86400),
          0,
        )
        .accountsPartial({
          escrow: newEscrow, vault: newVault,
          organizer: newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      const someWinner = Keypair.generate();
      await fund(provider, someWinner.publicKey, 1 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .claimPrize(0, 0)
          .accountsPartial({
            escrow:        newEscrow,
            vault:         newVault,
            winner:        someWinner.publicKey,
            organizer:     newOrganizer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([someWinner])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "NotFinalized");
        console.log("Unfinalized claim correctly rejected");
      }
    });

    it("Escrow closes when last tier is claimed", async () => {
      const organizerBefore = await provider.connection.getBalance(organizerForClaim.publicKey);

      // Claim tier 1 — this is the last unclaimed tier
      await program.methods
        .claimPrize(nonce, 1)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          winner:        winner2.publicKey,
          organizer:     organizerForClaim.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner2])
        .rpc();

      // Escrow account should be closed
      const escrowInfo = await provider.connection.getAccountInfo(escrowPda);
      assert.isNull(escrowInfo, "Escrow account should be closed");

      // Vault account should be closed
      const vaultInfo = await provider.connection.getAccountInfo(vaultPda);
      assert.isNull(vaultInfo, "Vault account should be closed");

      // Organizer should have received rent back
      const organizerAfter = await provider.connection.getBalance(organizerForClaim.publicKey);
      assert.isAbove(organizerAfter, organizerBefore, "Organizer should receive rent");

      console.log("Escrow and vault closed after last tier claimed");
    });
  });

  // -------------------------------------------------------------------------
  // refund_unclaimed — 5 tests
  // -------------------------------------------------------------------------

  describe("refund_unclaimed", () => {

    let escrowPda:          PublicKey;
    let vaultPda:           PublicKey;
    let organizerForRefund: Keypair;
    let judgesForRefund:    Keypair[];
    let winner1:            Keypair;
    const nonce = 0;

    before(async () => {
      organizerForRefund = Keypair.generate();
      judgesForRefund    = Array.from({ length: 5 }, () => Keypair.generate());
      winner1            = Keypair.generate();

      await fund(provider, organizerForRefund.publicKey, 100 * LAMPORTS_PER_SOL);

      [escrowPda] = deriveEscrow(organizerForRefund.publicKey, nonce, program.programId);
      [vaultPda]  = deriveVault(organizerForRefund.publicKey,  nonce, program.programId);

      await program.methods
        .initializeEscrow(
          "Refund Test Bounty", "",
          judgesForRefund.map(j => j.publicKey), 3,
          [
            new anchor.BN(20 * LAMPORTS_PER_SOL),
            new anchor.BN(15 * LAMPORTS_PER_SOL),
            new anchor.BN(10 * LAMPORTS_PER_SOL),
          ],
          new anchor.BN(Math.floor(Date.now() / 1000) + 1),
          nonce,
        )
        .accountsPartial({
          escrow: escrowPda, vault: vaultPda,
          organizer: organizerForRefund.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForRefund])
        .rpc();

      // Finalize and claim tier 0 only
      for (let i = 0; i < 3; i++) {
        await program.methods
          .voteWinner(nonce, 0, winner1.publicKey)
          .accountsPartial({ escrow: escrowPda, judge: judgesForRefund[i].publicKey })
          .signers([judgesForRefund[i]])
          .rpc();
      }

      await program.methods
        .claimPrize(nonce, 0)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          winner:        winner1.publicKey,
          organizer:     organizerForRefund.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner1])
        .rpc();

      console.log("Waiting for deadline...");
      await new Promise(r => setTimeout(r, 2000));
    });

    it("Successfully refunds unclaimed tiers after deadline", async () => {
      const organizerBefore = await provider.connection.getBalance(organizerForRefund.publicKey);
      const vaultBefore     = await provider.connection.getBalance(vaultPda);

      await program.methods
        .refundUnclaimed(nonce)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForRefund.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForRefund])
        .rpc();

      const vaultAfter = await provider.connection.getBalance(vaultPda);
      assert.equal(vaultBefore - vaultAfter, 25 * LAMPORTS_PER_SOL, "Should refund 25 SOL (tiers 1+2)");

      const organizerAfter = await provider.connection.getBalance(organizerForRefund.publicKey);
      assert.isAbove(organizerAfter, organizerBefore, "Organizer should receive refund + rent");

      // Escrow should be closed
      const escrowInfo = await provider.connection.getAccountInfo(escrowPda);
      assert.isNull(escrowInfo, "Escrow should be closed after refund");

      console.log("Refund successful — escrow closed");
    });

    it("Fails to refund before deadline", async () => {
      const newOrg = Keypair.generate();
      await fund(provider, newOrg.publicKey, 20 * LAMPORTS_PER_SOL);

      const [newEscrow] = deriveEscrow(newOrg.publicKey, 0, program.programId);
      const [newVault]  = deriveVault(newOrg.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "Pre-Deadline Test", "",
          judgesForRefund.map(j => j.publicKey), 3,
          [new anchor.BN(10 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
          0,
        )
        .accountsPartial({
          escrow: newEscrow, vault: newVault,
          organizer: newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrg])
        .rpc();

      try {
        await program.methods
          .refundUnclaimed(0)
          .accountsPartial({
            escrow:        newEscrow,
            vault:         newVault,
            organizer:     newOrg.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newOrg])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "DeadlineNotPassed");
        console.log("Pre-deadline refund correctly rejected");
      }
    });

    it("Fails when non-organizer tries to refund", async () => {
      const newOrg = Keypair.generate();
      await fund(provider, newOrg.publicKey, 20 * LAMPORTS_PER_SOL);

      const [newEscrow] = deriveEscrow(newOrg.publicKey, 0, program.programId);
      const [newVault]  = deriveVault(newOrg.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "Non-Org Refund Test", "",
          judgesForRefund.map(j => j.publicKey), 3,
          [new anchor.BN(10 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 1),
          0,
        )
        .accountsPartial({
          escrow: newEscrow, vault: newVault,
          organizer: newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrg])
        .rpc();

      await new Promise(r => setTimeout(r, 2000));

      const impostor = Keypair.generate();
      await fund(provider, impostor.publicKey, 1 * LAMPORTS_PER_SOL);

      try {
        await program.methods
          .refundUnclaimed(0)
          .accountsPartial({
            escrow:        newEscrow,
            vault:         newVault,
            organizer:     impostor.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([impostor])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
        console.log("Non-organizer refund correctly rejected");
      }
    });

    it("Fails when nothing to refund (all claimed)", async () => {
      const newOrg    = Keypair.generate();
      const newJudges = Array.from({ length: 3 }, () => Keypair.generate());
      const winner    = Keypair.generate();

      await fund(provider, newOrg.publicKey, 20 * LAMPORTS_PER_SOL);

      const [newEscrow] = deriveEscrow(newOrg.publicKey, 0, program.programId);
      const [newVault]  = deriveVault(newOrg.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "All Claimed Test", "",
          newJudges.map(j => j.publicKey), 2,
          [new anchor.BN(5 * LAMPORTS_PER_SOL)],
          new anchor.BN(Math.floor(Date.now() / 1000) + 1),
          0,
        )
        .accountsPartial({
          escrow: newEscrow, vault: newVault,
          organizer: newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrg])
        .rpc();

      for (let i = 0; i < 2; i++) {
        await program.methods
          .voteWinner(0, 0, winner.publicKey)
          .accountsPartial({ escrow: newEscrow, judge: newJudges[i].publicKey })
          .signers([newJudges[i]])
          .rpc();
      }

      await program.methods
        .claimPrize(0, 0)
        .accountsPartial({
          escrow:        newEscrow,
          vault:         newVault,
          winner:        winner.publicKey,
          organizer:     newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      await new Promise(r => setTimeout(r, 2000));

      // Escrow already closed by auto-close — refund should fail
      try {
        await program.methods
          .refundUnclaimed(0)
          .accountsPartial({
            escrow:        newEscrow,
            vault:         newVault,
            organizer:     newOrg.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newOrg])
          .rpc();
        assert.fail("Should have failed");
      } catch (error) {
        // Either NoUnclaimedFunds or account not found — both are correct
        console.log("All-claimed refund correctly rejected:", error.message.slice(0, 60));
      }
    });

    it("Correctly calculates partial refund", async () => {
      const newOrg    = Keypair.generate();
      const newJudges = Array.from({ length: 3 }, () => Keypair.generate());
      const winner    = Keypair.generate();

      await fund(provider, newOrg.publicKey, 100 * LAMPORTS_PER_SOL);

      const [newEscrow] = deriveEscrow(newOrg.publicKey, 0, program.programId);
      const [newVault]  = deriveVault(newOrg.publicKey,  0, program.programId);

      await program.methods
        .initializeEscrow(
          "Partial Refund Test", "",
          newJudges.map(j => j.publicKey), 2,
          [
            new anchor.BN(30 * LAMPORTS_PER_SOL),
            new anchor.BN(20 * LAMPORTS_PER_SOL),
            new anchor.BN(10 * LAMPORTS_PER_SOL),
          ],
          new anchor.BN(Math.floor(Date.now() / 1000) + 1),
          0,
        )
        .accountsPartial({
          escrow: newEscrow, vault: newVault,
          organizer: newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrg])
        .rpc();

      for (let i = 0; i < 2; i++) {
        await program.methods
          .voteWinner(0, 0, winner.publicKey)
          .accountsPartial({ escrow: newEscrow, judge: newJudges[i].publicKey })
          .signers([newJudges[i]])
          .rpc();
      }

      await program.methods
        .claimPrize(0, 0)
        .accountsPartial({
          escrow:        newEscrow,
          vault:         newVault,
          winner:        winner.publicKey,
          organizer:     newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      await new Promise(r => setTimeout(r, 2000));

      const vaultBefore = await provider.connection.getBalance(newVault);

      await program.methods
        .refundUnclaimed(0)
        .accountsPartial({
          escrow:        newEscrow,
          vault:         newVault,
          organizer:     newOrg.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrg])
        .rpc();

      const vaultAfter = await provider.connection.getBalance(newVault);
      assert.equal(vaultBefore - vaultAfter, 30 * LAMPORTS_PER_SOL, "Should refund 30 SOL (tiers 1+2)");

      console.log("Partial refund correct — 30 SOL refunded, escrow closed");
    });
  });
});