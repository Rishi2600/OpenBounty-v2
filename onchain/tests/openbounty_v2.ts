// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { OpenbountyV2 } from "../target/types/openbounty_v2";
// import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
// import { assert } from "chai";

// describe("openbounty_v2", () => {
//   // Configure the client to use the local cluster
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.OpenbountyV2 as Program<OpenbountyV2>;

//   // Test accounts
//   let organizer: Keypair;
//   let judge1: Keypair;
//   let judge2: Keypair;
//   let judge3: Keypair;
//   let judge4: Keypair;
//   let judge5: Keypair;

//   before(async () => {
//     // Create test keypairs
//     organizer = Keypair.generate();
//     judge1 = Keypair.generate();
//     judge2 = Keypair.generate();
//     judge3 = Keypair.generate();
//     judge4 = Keypair.generate();
//     judge5 = Keypair.generate();

//     // Airdrop SOL to organizer for testing
//     const airdropSignature = await provider.connection.requestAirdrop(
//       organizer.publicKey,
//       100 * LAMPORTS_PER_SOL,
//     );
//     await provider.connection.confirmTransaction(airdropSignature);
//   });

//   describe("initialize_escrow", () => {
//     it("Successfully initializes an escrow with valid parameters", async () => {
//       // Derive PDAs
//       const [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       // Setup test data
//       const judges = [
//         judge1.publicKey,
//         judge2.publicKey,
//         judge3.publicKey,
//         judge4.publicKey,
//         judge5.publicKey,
//       ];
//       const threshold = 3;
//       const tierAmounts = [
//         new anchor.BN(20 * LAMPORTS_PER_SOL), // 20 SOL
//         new anchor.BN(15 * LAMPORTS_PER_SOL), // 15 SOL
//         new anchor.BN(10 * LAMPORTS_PER_SOL), // 10 SOL
//         new anchor.BN(5 * LAMPORTS_PER_SOL), // 5 SOL
//       ];
//       const deadline = new anchor.BN(
//         Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days from now
//       );

//       // Get organizer balance before
//       const balanceBefore = await provider.connection.getBalance(
//         organizer.publicKey,
//       );

//       // Initialize escrow
//       const tx = await program.methods
//         .initializeEscrow(judges, threshold, tierAmounts, deadline)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           organizer: organizer.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([organizer])
//         .rpc();

//       console.log("Initialize escrow transaction:", tx);

//       // Fetch the escrow account
//       const escrowAccount = await program.account.escrow.fetch(escrowPda);

//       // Verify escrow data
//       assert.equal(
//         escrowAccount.organizer.toBase58(),
//         organizer.publicKey.toBase58(),
//         "Organizer should match",
//       );
//       assert.equal(escrowAccount.judges.length, 5, "Should have 5 judges");
//       assert.equal(escrowAccount.threshold, 3, "Threshold should be 3");
//       assert.equal(escrowAccount.tiers.length, 4, "Should have 4 prize tiers");
//       assert.equal(
//         escrowAccount.deadline.toNumber(),
//         deadline.toNumber(),
//         "Deadline should match",
//       );

//       // Verify judges
//       for (let i = 0; i < judges.length; i++) {
//         assert.equal(
//           escrowAccount.judges[i].toBase58(),
//           judges[i].toBase58(),
//           `Judge ${i + 1} should match`,
//         );
//       }

//       // Verify tiers
//       assert.equal(
//         escrowAccount.tiers[0].amount.toNumber(),
//         20 * LAMPORTS_PER_SOL,
//         "Tier 0 amount should be 20 SOL",
//       );
//       assert.equal(
//         escrowAccount.tiers[1].amount.toNumber(),
//         15 * LAMPORTS_PER_SOL,
//         "Tier 1 amount should be 15 SOL",
//       );
//       assert.equal(
//         escrowAccount.tiers[2].amount.toNumber(),
//         10 * LAMPORTS_PER_SOL,
//         "Tier 2 amount should be 10 SOL",
//       );
//       assert.equal(
//         escrowAccount.tiers[3].amount.toNumber(),
//         5 * LAMPORTS_PER_SOL,
//         "Tier 3 amount should be 5 SOL",
//       );

//       // Verify all tiers are unclaimed and have no winner
//       escrowAccount.tiers.forEach((tier, index) => {
//         assert.isNull(tier.winner, `Tier ${index} should have no winner yet`);
//         assert.isFalse(tier.claimed, `Tier ${index} should be unclaimed`);
//       });

//       // Verify vault received the funds
//       const vaultBalance = await provider.connection.getBalance(vaultPda);
//       const expectedTotal = 50 * LAMPORTS_PER_SOL; // 20 + 15 + 10 + 5
//       assert.equal(
//         vaultBalance,
//         expectedTotal,
//         "Vault should have 50 SOL locked",
//       );

//       // Verify organizer balance decreased
//       const balanceAfter = await provider.connection.getBalance(
//         organizer.publicKey,
//       );
//       const balanceDiff = balanceBefore - balanceAfter;
//       assert.isAbove(
//         balanceDiff,
//         expectedTotal,
//         "Organizer should have transferred at least 50 SOL (plus rent)",
//       );

//       console.log("Escrow initialized successfully!");
//       console.log(`   Organizer: ${escrowAccount.organizer.toBase58()}`);
//       console.log(`   Judges: ${escrowAccount.judges.length}`);
//       console.log(`   Threshold: ${escrowAccount.threshold}`);
//       console.log(`   Tiers: ${escrowAccount.tiers.length}`);
//       console.log(`   Total locked: ${vaultBalance / LAMPORTS_PER_SOL} SOL`);
//     });

//     it("Fails to initialize with invalid threshold (too high)", async () => {
//       const organizer2 = Keypair.generate();
//       await provider.connection.requestAirdrop(
//         organizer2.publicKey,
//         10 * LAMPORTS_PER_SOL,
//       );
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizer2.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizer2.publicKey.toBuffer()],
//         program.programId,
//       );

//       const judges = [judge1.publicKey, judge2.publicKey, judge3.publicKey];
//       const invalidThreshold = 5; // More than number of judges!
//       const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
//       const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

//       try {
//         await program.methods
//           .initializeEscrow(judges, invalidThreshold, tierAmounts, deadline)
//           .accountsPartial({
//             escrow: escrowPda,
//             vault: vaultPda,
//             organizer: organizer2.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([organizer2])
//           .rpc();

//         assert.fail("Should have failed with invalid threshold");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "InvalidThreshold",
//           "Should fail with InvalidThreshold error",
//         );
//         console.log("Correctly rejected invalid threshold");
//       }
//     });

//     it("Fails to initialize with past deadline", async () => {
//       const organizer3 = Keypair.generate();
//       await provider.connection.requestAirdrop(
//         organizer3.publicKey,
//         10 * LAMPORTS_PER_SOL,
//       );
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizer3.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizer3.publicKey.toBuffer()],
//         program.programId,
//       );

//       const judges = [judge1.publicKey, judge2.publicKey];
//       const threshold = 2;
//       const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
//       const pastDeadline = new anchor.BN(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago

//       try {
//         await program.methods
//           .initializeEscrow(judges, threshold, tierAmounts, pastDeadline)
//           .accountsPartial({
//             escrow: escrowPda,
//             vault: vaultPda,
//             organizer: organizer3.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([organizer3])
//           .rpc();

//         assert.fail("Should have failed with invalid deadline");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "InvalidDeadline",
//           "Should fail with InvalidDeadline error",
//         );
//         console.log("Correctly rejected past deadline");
//       }
//     });

//     it("Fails to initialize with no judges", async () => {
//       const organizer4 = Keypair.generate();
//       await provider.connection.requestAirdrop(
//         organizer4.publicKey,
//         10 * LAMPORTS_PER_SOL,
//       );
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizer4.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizer4.publicKey.toBuffer()],
//         program.programId,
//       );

//       const emptyJudges = [];
//       const threshold = 1;
//       const tierAmounts = [new anchor.BN(1 * LAMPORTS_PER_SOL)];
//       const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

//       try {
//         await program.methods
//           .initializeEscrow(emptyJudges, threshold, tierAmounts, deadline)
//           .accountsPartial({
//             escrow: escrowPda,
//             vault: vaultPda,
//             organizer: organizer4.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([organizer4])
//           .rpc();

//         assert.fail("Should have failed with no judges");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "NoJudges",
//           "Should fail with NoJudges error",
//         );
//         console.log("Correctly rejected empty judge list");
//       }
//     });
//   });

//   describe("finalize_winner", () => {
//     let escrowPda: PublicKey;
//     let vaultPda: PublicKey;
//     let organizerForFinalize: Keypair;
//     let judgesForFinalize: Keypair[];

//     before(async () => {
//       // Create fresh keypairs for finalize tests
//       organizerForFinalize = Keypair.generate();
//       judgesForFinalize = [
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//       ];

//       // Airdrop SOL to organizer
//       const airdropSig = await provider.connection.requestAirdrop(
//         organizerForFinalize.publicKey,
//         100 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       // Derive PDAs
//       [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizerForFinalize.publicKey.toBuffer()],
//         program.programId,
//       );

//       [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizerForFinalize.publicKey.toBuffer()],
//         program.programId,
//       );

//       // Initialize escrow first
//       const judges = judgesForFinalize.map((j) => j.publicKey);
//       const threshold = 3;
//       const tierAmounts = [
//         new anchor.BN(20 * LAMPORTS_PER_SOL),
//         new anchor.BN(15 * LAMPORTS_PER_SOL),
//         new anchor.BN(10 * LAMPORTS_PER_SOL),
//         new anchor.BN(5 * LAMPORTS_PER_SOL),
//       ];
//       const deadline = new anchor.BN(
//         Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
//       );

//       await program.methods
//         .initializeEscrow(judges, threshold, tierAmounts, deadline)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           organizer: organizerForFinalize.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([organizerForFinalize])
//         .rpc();
//     });

//     it("Successfully finalizes winner with valid signatures (3 of 5)", async () => {
//       const winner = Keypair.generate();
//       const tier = 0;

//       // Create message that judges will "sign"
//       const message = `tier:${tier},winner:${winner.publicKey.toBase58()}`;
//       console.log("Message to sign:", message);

//       // Simulate signatures from 3 judges
//       // In real implementation, each judge would sign with their private key
//       // For testing, we create mock 64-byte signatures
//       const signatures: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any, // Judge 0 signature
//         Array(64).fill(2) as any, // Judge 1 signature
//         Array(64).fill(3) as any, // Judge 2 signature
//         Array(64).fill(0) as any, // Judge 3 no signature
//         Array(64).fill(0) as any, // Judge 4 no signature
//       ];

//       // Call finalize_winner
//       const tx = await program.methods
//         .finalizeWinner(tier, winner.publicKey, signatures)
//         .accounts({
//           escrow: escrowPda,
//           organizer: organizerForFinalize.publicKey,
//         })
//         .rpc();

//       console.log("Finalize winner transaction:", tx);

//       // Fetch escrow and verify winner is set
//       const escrowAccount = await program.account.escrow.fetch(escrowPda);

//       assert.isNotNull(
//         escrowAccount.tiers[tier].winner,
//         "Winner should be set",
//       );
//       assert.equal(
//         escrowAccount.tiers[tier].winner.toBase58(),
//         winner.publicKey.toBase58(),
//         "Winner should match",
//       );
//       assert.isFalse(
//         escrowAccount.tiers[tier].claimed,
//         "Tier should not be claimed yet",
//       );

//       console.log("Winner finalized successfully for tier", tier);
//       console.log(
//         "Winner address:",
//         escrowAccount.tiers[tier].winner.toBase58(),
//       );
//     });

//     it("Fails to finalize with insufficient signatures (only 2 of 5)", async () => {
//       const winner = Keypair.generate();
//       const tier = 1;

//       // Only 2 signatures (threshold is 3)
//       const signatures: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any, // Judge 0 signature
//         Array(64).fill(2) as any, // Judge 1 signature
//         Array(64).fill(0) as any, // Judge 2 no signature
//         Array(64).fill(0) as any, // Judge 3 no signature
//         Array(64).fill(0) as any, // Judge 4 no signature
//       ];

//       try {
//         await program.methods
//           .finalizeWinner(tier, winner.publicKey, signatures)
//           .accounts({
//             escrow: escrowPda,
//             organizer: organizerForFinalize.publicKey,
//           })
//           .rpc();

//         assert.fail("Should have failed with insufficient signatures");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "InsufficientSignatures",
//           "Should fail with InsufficientSignatures error",
//         );
//         console.log("Correctly rejected insufficient signatures");
//       }
//     });

//     it("Fails to finalize tier that is already finalized", async () => {
//       const anotherWinner = Keypair.generate();
//       const tier = 0; // Already finalized in first test

//       const signatures: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       try {
//         await program.methods
//           .finalizeWinner(tier, anotherWinner.publicKey, signatures)
//           .accounts({
//             escrow: escrowPda,
//             organizer: organizerForFinalize.publicKey,
//           })
//           .rpc();

//         assert.fail("Should have failed - tier already finalized");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "AlreadyFinalized",
//           "Should fail with AlreadyFinalized error",
//         );
//         console.log("Correctly rejected already finalized tier");
//       }
//     });

//     it("Fails to finalize with invalid tier index", async () => {
//       const winner = Keypair.generate();
//       const invalidTier = 10; // Only have 4 tiers (0-3)

//       const signatures: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       try {
//         await program.methods
//           .finalizeWinner(invalidTier, winner.publicKey, signatures)
//           .accounts({
//             escrow: escrowPda,
//             organizer: organizerForFinalize.publicKey,
//           })
//           .rpc();

//         assert.fail("Should have failed with invalid tier");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "InvalidTier",
//           "Should fail with InvalidTier error",
//         );
//         console.log("Correctly rejected invalid tier index");
//       }
//     });

//     it("Can finalize multiple different tiers independently", async () => {
//       const winner2 = Keypair.generate();
//       const winner3 = Keypair.generate();

//       // Finalize tier 2
//       const signatures2: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(2, winner2.publicKey, signatures2)
//         .accounts({
//           escrow: escrowPda,
//           organizer: organizerForFinalize.publicKey,
//         })
//         .rpc();

//       // Finalize tier 3
//       const signatures3: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(4) as any,
//         Array(64).fill(5) as any,
//         Array(64).fill(6) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(3, winner3.publicKey, signatures3)
//         .accounts({
//           escrow: escrowPda,
//           organizer: organizerForFinalize.publicKey,
//         })
//         .rpc();

//       // Verify both tiers are finalized
//       const escrowAccount = await program.account.escrow.fetch(escrowPda);

//       assert.equal(
//         escrowAccount.tiers[2].winner.toBase58(),
//         winner2.publicKey.toBase58(),
//         "Tier 2 winner should match",
//       );
//       assert.equal(
//         escrowAccount.tiers[3].winner.toBase58(),
//         winner3.publicKey.toBase58(),
//         "Tier 3 winner should match",
//       );

//       console.log("Successfully finalized multiple tiers independently");
//       console.log("Tier 2 winner:", escrowAccount.tiers[2].winner.toBase58());
//       console.log("Tier 3 winner:", escrowAccount.tiers[3].winner.toBase58());
//     });
//   });

//   describe("claim_prize", () => {
//     let escrowPda: PublicKey;
//     let vaultPda: PublicKey;
//     let organizerForClaim: Keypair;
//     let judgesForClaim: Keypair[];
//     let winner1: Keypair;
//     let winner2: Keypair;

//     before(async () => {
//       // Create fresh keypairs for claim tests
//       organizerForClaim = Keypair.generate();
//       judgesForClaim = [
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//       ];
//       winner1 = Keypair.generate();
//       winner2 = Keypair.generate();

//       // Airdrop SOL to organizer
//       const airdropSig = await provider.connection.requestAirdrop(
//         organizerForClaim.publicKey,
//         100 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       // Derive PDAs
//       [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizerForClaim.publicKey.toBuffer()],
//         program.programId,
//       );

//       [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizerForClaim.publicKey.toBuffer()],
//         program.programId,
//       );

//       // Initialize escrow
//       const judges = judgesForClaim.map((j) => j.publicKey);
//       const threshold = 3;
//       const tierAmounts = [
//         new anchor.BN(20 * LAMPORTS_PER_SOL),
//         new anchor.BN(15 * LAMPORTS_PER_SOL),
//       ];
//       const deadline = new anchor.BN(
//         Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
//       );

//       await program.methods
//         .initializeEscrow(judges, threshold, tierAmounts, deadline)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           organizer: organizerForClaim.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([organizerForClaim])
//         .rpc();

//       // Finalize winner for tier 0
//       const signatures0: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(0, winner1.publicKey, signatures0)
//         .accountsPartial({
//           escrow: escrowPda,
//           organizer: organizerForClaim.publicKey,
//         })
//         .rpc();

//       // Finalize winner for tier 1
//       const signatures1: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(4) as any,
//         Array(64).fill(5) as any,
//         Array(64).fill(6) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(1, winner2.publicKey, signatures1)
//         .accountsPartial({
//           escrow: escrowPda,
//           organizer: organizerForClaim.publicKey,
//         })
//         .rpc();
//     });

//     it("Successfully claims prize as the designated winner", async () => {
//       // Get balances before claim
//       const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
//       const winnerBalanceBefore = await provider.connection.getBalance(
//         winner1.publicKey,
//       );

//       console.log(
//         "Vault balance before:",
//         vaultBalanceBefore / LAMPORTS_PER_SOL,
//         "SOL",
//       );
//       console.log(
//         "Winner balance before:",
//         winnerBalanceBefore / LAMPORTS_PER_SOL,
//         "SOL",
//       );

//       // Winner claims prize
//       const tx = await program.methods
//         .claimPrize(0)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           winner: winner1.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([winner1])
//         .rpc();

//       console.log("Claim prize transaction:", tx);

//       // Get balances after claim
//       const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
//       const winnerBalanceAfter = await provider.connection.getBalance(
//         winner1.publicKey,
//       );

//       console.log(
//         "Vault balance after:",
//         vaultBalanceAfter / LAMPORTS_PER_SOL,
//         "SOL",
//       );
//       console.log(
//         "Winner balance after:",
//         winnerBalanceAfter / LAMPORTS_PER_SOL,
//         "SOL",
//       );

//       // Verify vault balance decreased by prize amount
//       const expectedDecrease = 20 * LAMPORTS_PER_SOL;
//       assert.equal(
//         vaultBalanceBefore - vaultBalanceAfter,
//         expectedDecrease,
//         "Vault should have decreased by 20 SOL",
//       );

//       // Verify winner balance increased (accounting for tx fees)
//       const balanceIncrease = winnerBalanceAfter - winnerBalanceBefore;
//       assert.isAbove(
//         balanceIncrease,
//         19 * LAMPORTS_PER_SOL,
//         "Winner should have received approximately 20 SOL",
//       );

//       // Verify tier is marked as claimed
//       const escrowAccount = await program.account.escrow.fetch(escrowPda);
//       assert.isTrue(
//         escrowAccount.tiers[0].claimed,
//         "Tier 0 should be marked as claimed",
//       );

//       console.log("Prize claimed successfully");
//       console.log(
//         "Winner received approximately",
//         balanceIncrease / LAMPORTS_PER_SOL,
//         "SOL",
//       );
//     });

//     it("Fails to claim prize if not the winner", async () => {
//       const impostor = Keypair.generate();

//       // Airdrop to impostor for tx fees
//       const airdropSig = await provider.connection.requestAirdrop(
//         impostor.publicKey,
//         1 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       try {
//         await program.methods
//           .claimPrize(1)
//           .accountsPartial({
//             escrow: escrowPda,
//             vault: vaultPda,
//             winner: impostor.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([impostor])
//           .rpc();

//         assert.fail("Should have failed - caller is not the winner");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "Unauthorized",
//           "Should fail with Unauthorized error",
//         );
//         console.log("Correctly rejected non-winner claim attempt");
//       }
//     });

//     it("Fails to claim prize that was already claimed", async () => {
//       try {
//         await program.methods
//           .claimPrize(0)
//           .accountsPartial({
//             escrow: escrowPda,
//             vault: vaultPda,
//             winner: winner1.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([winner1])
//           .rpc();

//         assert.fail("Should have failed - prize already claimed");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "TierAlreadyClaimed",
//           "Should fail with TierAlreadyClaimed error",
//         );
//         console.log("Correctly rejected double claim attempt");
//       }
//     });

//     it("Fails to claim prize for tier that has no winner set", async () => {
//       // Create a new escrow with 3 tiers
//       const newOrganizer = Keypair.generate();
//       const airdropSig = await provider.connection.requestAirdrop(
//         newOrganizer.publicKey,
//         50 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       const [newEscrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [newVaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const judges = judgesForClaim.map((j) => j.publicKey);
//       const tierAmounts = [
//         new anchor.BN(10 * LAMPORTS_PER_SOL),
//         new anchor.BN(5 * LAMPORTS_PER_SOL),
//         new anchor.BN(3 * LAMPORTS_PER_SOL),
//       ];
//       const deadline = new anchor.BN(
//         Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
//       );

//       await program.methods
//         .initializeEscrow(judges, 3, tierAmounts, deadline)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           organizer: newOrganizer.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([newOrganizer])
//         .rpc();

//       // Try to claim tier 2 without finalizing winner
//       const someWinner = Keypair.generate();
//       const airdrop2 = await provider.connection.requestAirdrop(
//         someWinner.publicKey,
//         1 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdrop2);

//       try {
//         await program.methods
//           .claimPrize(2)
//           .accountsPartial({
//             escrow: newEscrowPda,
//             vault: newVaultPda,
//             winner: someWinner.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([someWinner])
//           .rpc();

//         assert.fail("Should have failed - winner not finalized");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "NotFinalized",
//           "Should fail with NotFinalized error",
//         );
//         console.log("Correctly rejected claim for unfinalized tier");
//       }
//     });

//     it("Allows multiple different winners to claim their respective prizes", async () => {
//       // Winner 2 claims their prize (tier 1)
//       const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);
//       const winner2BalanceBefore = await provider.connection.getBalance(
//         winner2.publicKey,
//       );

//       await program.methods
//         .claimPrize(1)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           winner: winner2.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([winner2])
//         .rpc();

//       const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);
//       const winner2BalanceAfter = await provider.connection.getBalance(
//         winner2.publicKey,
//       );

//       // Verify vault decreased by 15 SOL
//       assert.equal(
//         vaultBalanceBefore - vaultBalanceAfter,
//         15 * LAMPORTS_PER_SOL,
//         "Vault should decrease by 15 SOL",
//       );

//       // Verify winner2 received approximately 15 SOL
//       const increase = winner2BalanceAfter - winner2BalanceBefore;
//       assert.isAbove(
//         increase,
//         14 * LAMPORTS_PER_SOL,
//         "Winner 2 should receive approximately 15 SOL",
//       );

//       // Verify both tiers are claimed
//       const escrowAccount = await program.account.escrow.fetch(escrowPda);
//       assert.isTrue(escrowAccount.tiers[0].claimed, "Tier 0 should be claimed");
//       assert.isTrue(escrowAccount.tiers[1].claimed, "Tier 1 should be claimed");

//       console.log("Multiple winners claimed successfully");
//       console.log("Winner 1 claimed tier 0: 20 SOL");
//       console.log("Winner 2 claimed tier 1: 15 SOL");
//     });
//   });

//   describe("refund_unclaimed", () => {
//     let escrowPda: PublicKey;
//     let vaultPda: PublicKey;
//     let organizerForRefund: Keypair;
//     let judgesForRefund: Keypair[];
//     let winner1: Keypair;

//     before(async () => {
//       // Create fresh keypairs for refund tests
//       organizerForRefund = Keypair.generate();
//       judgesForRefund = [
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//         Keypair.generate(),
//       ];
//       winner1 = Keypair.generate();

//       // Airdrop SOL to organizer
//       const airdropSig = await provider.connection.requestAirdrop(
//         organizerForRefund.publicKey,
//         100 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       // Derive PDAs
//       [escrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), organizerForRefund.publicKey.toBuffer()],
//         program.programId,
//       );

//       [vaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), organizerForRefund.publicKey.toBuffer()],
//         program.programId,
//       );

//       // Initialize escrow with short deadline (1 second from now)
//       const judges = judgesForRefund.map((j) => j.publicKey);
//       const threshold = 3;
//       const tierAmounts = [
//         new anchor.BN(20 * LAMPORTS_PER_SOL),
//         new anchor.BN(15 * LAMPORTS_PER_SOL),
//         new anchor.BN(10 * LAMPORTS_PER_SOL),
//       ];
//       const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 1);

//       await program.methods
//         .initializeEscrow(judges, threshold, tierAmounts, deadline)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           organizer: organizerForRefund.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([organizerForRefund])
//         .rpc();

//       // Finalize and claim tier 0 only
//       const signatures0: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(0, winner1.publicKey, signatures0)
//         .accountsPartial({
//           escrow: escrowPda,
//           organizer: organizerForRefund.publicKey,
//         })
//         .rpc();

//       await program.methods
//         .claimPrize(0)
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           winner: winner1.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([winner1])
//         .rpc();

//       // Wait for deadline to pass
//       console.log("Waiting for deadline to pass...");
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//     });

//     it("Successfully refunds unclaimed prizes after deadline", async () => {
//       const organizerBalanceBefore = await provider.connection.getBalance(
//         organizerForRefund.publicKey,
//       );
//       const vaultBalanceBefore = await provider.connection.getBalance(vaultPda);

//       console.log(
//         "Organizer balance before:",
//         organizerBalanceBefore / LAMPORTS_PER_SOL,
//         "SOL",
//       );
//       console.log(
//         "Vault balance before:",
//         vaultBalanceBefore / LAMPORTS_PER_SOL,
//         "SOL",
//       );

//       // Refund unclaimed prizes
//       const tx = await program.methods
//         .refundUnclaimed()
//         .accountsPartial({
//           escrow: escrowPda,
//           vault: vaultPda,
//           organizer: organizerForRefund.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([organizerForRefund])
//         .rpc();

//       console.log("Refund transaction:", tx);

//       const organizerBalanceAfter = await provider.connection.getBalance(
//         organizerForRefund.publicKey,
//       );
//       const vaultBalanceAfter = await provider.connection.getBalance(vaultPda);

//       console.log(
//         "Organizer balance after:",
//         organizerBalanceAfter / LAMPORTS_PER_SOL,
//         "SOL",
//       );
//       console.log(
//         "Vault balance after:",
//         vaultBalanceAfter / LAMPORTS_PER_SOL,
//         "SOL",
//       );

//       // Expected refund: tier 1 (15 SOL) + tier 2 (10 SOL) = 25 SOL
//       const expectedRefund = 25 * LAMPORTS_PER_SOL;
//       const actualRefund = vaultBalanceBefore - vaultBalanceAfter;

//       assert.equal(
//         actualRefund,
//         expectedRefund,
//         "Vault should decrease by 25 SOL (unclaimed tiers)",
//       );

//       // Organizer balance should increase (minus tx fees)
//       const balanceIncrease = organizerBalanceAfter - organizerBalanceBefore;
//       assert.isAbove(
//         balanceIncrease,
//         24 * LAMPORTS_PER_SOL,
//         "Organizer should receive approximately 25 SOL",
//       );

//       console.log("Refund successful");
//       console.log("Refunded amount:", actualRefund / LAMPORTS_PER_SOL, "SOL");
//     });

//     it("Fails to refund before deadline passes", async () => {
//       // Create new escrow with future deadline
//       const newOrganizer = Keypair.generate();
//       const airdropSig = await provider.connection.requestAirdrop(
//         newOrganizer.publicKey,
//         50 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       const [newEscrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [newVaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const judges = judgesForRefund.map((j) => j.publicKey);
//       const tierAmounts = [new anchor.BN(10 * LAMPORTS_PER_SOL)];
//       const futureDeadline = new anchor.BN(
//         Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
//       );

//       await program.methods
//         .initializeEscrow(judges, 3, tierAmounts, futureDeadline)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           organizer: newOrganizer.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([newOrganizer])
//         .rpc();

//       try {
//         await program.methods
//           .refundUnclaimed()
//           .accountsPartial({
//             escrow: newEscrowPda,
//             vault: newVaultPda,
//             organizer: newOrganizer.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([newOrganizer])
//           .rpc();

//         assert.fail("Should have failed - deadline not passed");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "DeadlineNotPassed",
//           "Should fail with DeadlineNotPassed error",
//         );
//         console.log("Correctly rejected refund before deadline");
//       }
//     });

//     it("Fails when non-organizer tries to refund", async () => {
//       const impostor = Keypair.generate();
//       const airdropSig = await provider.connection.requestAirdrop(
//         impostor.publicKey,
//         1 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       try {
//         await program.methods
//           .refundUnclaimed()
//           .accountsPartial({
//             escrow: escrowPda,
//             vault: vaultPda,
//             organizer: impostor.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([impostor])
//           .rpc();

//         assert.fail("Should have failed - caller is not organizer");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "Unauthorized",
//           "Should fail with Unauthorized error",
//         );
//         console.log("Correctly rejected non-organizer refund attempt");
//       }
//     });

//     it("Fails when all prizes are already claimed (nothing to refund)", async () => {
//       // Create escrow where all prizes will be claimed
//       const newOrganizer = Keypair.generate();
//       const airdropSig = await provider.connection.requestAirdrop(
//         newOrganizer.publicKey,
//         50 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       const [newEscrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [newVaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const judges = judgesForRefund.map((j) => j.publicKey);
//       const tierAmounts = [new anchor.BN(10 * LAMPORTS_PER_SOL)];
//       const shortDeadline = new anchor.BN(Math.floor(Date.now() / 1000) + 1);

//       await program.methods
//         .initializeEscrow(judges, 3, tierAmounts, shortDeadline)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           organizer: newOrganizer.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([newOrganizer])
//         .rpc();

//       // Finalize and claim the only prize
//       const someWinner = Keypair.generate();
//       const signatures: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(0, someWinner.publicKey, signatures)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           organizer: newOrganizer.publicKey,
//         })
//         .rpc();

//       await program.methods
//         .claimPrize(0)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           winner: someWinner.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([someWinner])
//         .rpc();

//       // Wait for deadline
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       try {
//         await program.methods
//           .refundUnclaimed()
//           .accountsPartial({
//             escrow: newEscrowPda,
//             vault: newVaultPda,
//             organizer: newOrganizer.publicKey,
//             systemProgram: anchor.web3.SystemProgram.programId,
//           })
//           .signers([newOrganizer])
//           .rpc();

//         assert.fail("Should have failed - no unclaimed funds");
//       } catch (error) {
//         assert.include(
//           error.message,
//           "NoUnclaimedFunds",
//           "Should fail with NoUnclaimedFunds error",
//         );
//         console.log("Correctly rejected refund when all prizes claimed");
//       }
//     });

//     it("Correctly calculates partial refund (some claimed, some unclaimed)", async () => {
//       // Create escrow with 3 tiers
//       const newOrganizer = Keypair.generate();
//       const airdropSig = await provider.connection.requestAirdrop(
//         newOrganizer.publicKey,
//         100 * LAMPORTS_PER_SOL,
//       );
//       await provider.connection.confirmTransaction(airdropSig);

//       const [newEscrowPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("escrow"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const [newVaultPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("vault"), newOrganizer.publicKey.toBuffer()],
//         program.programId,
//       );

//       const judges = judgesForRefund.map((j) => j.publicKey);
//       const tierAmounts = [
//         new anchor.BN(30 * LAMPORTS_PER_SOL),
//         new anchor.BN(20 * LAMPORTS_PER_SOL),
//         new anchor.BN(10 * LAMPORTS_PER_SOL),
//       ];
//       const shortDeadline = new anchor.BN(Math.floor(Date.now() / 1000) + 1);

//       await program.methods
//         .initializeEscrow(judges, 3, tierAmounts, shortDeadline)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           organizer: newOrganizer.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([newOrganizer])
//         .rpc();

//       // Claim only tier 0 (30 SOL)
//       const winner = Keypair.generate();
//       const signatures: [
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//         number,
//       ][] = [
//         Array(64).fill(1) as any,
//         Array(64).fill(2) as any,
//         Array(64).fill(3) as any,
//         Array(64).fill(0) as any,
//         Array(64).fill(0) as any,
//       ];

//       await program.methods
//         .finalizeWinner(0, winner.publicKey, signatures)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           organizer: newOrganizer.publicKey,
//         })
//         .rpc();

//       await program.methods
//         .claimPrize(0)
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           winner: winner.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([winner])
//         .rpc();

//       // Wait for deadline
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       // Refund should be tier 1 (20) + tier 2 (10) = 30 SOL
//       const vaultBalanceBefore = await provider.connection.getBalance(
//         newVaultPda,
//       );

//       await program.methods
//         .refundUnclaimed()
//         .accountsPartial({
//           escrow: newEscrowPda,
//           vault: newVaultPda,
//           organizer: newOrganizer.publicKey,
//           systemProgram: anchor.web3.SystemProgram.programId,
//         })
//         .signers([newOrganizer])
//         .rpc();

//       const vaultBalanceAfter = await provider.connection.getBalance(
//         newVaultPda,
//       );
//       const refunded = vaultBalanceBefore - vaultBalanceAfter;

//       assert.equal(
//         refunded,
//         30 * LAMPORTS_PER_SOL,
//         "Should refund exactly 30 SOL (tier 1 + tier 2)",
//       );

//       console.log("Partial refund successful");
//       console.log("Tier 0: Claimed (30 SOL)");
//       console.log("Tier 1 + 2: Refunded (30 SOL)");
//     });
//   });
// });


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

  const signers = payer ? [payer] : [];

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: to,
      lamports,
    })
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
    // Create keypairs
    organizer = Keypair.generate();
    judge1    = Keypair.generate();
    judge2    = Keypair.generate();
    judge3    = Keypair.generate();
    judge4    = Keypair.generate();
    judge5    = Keypair.generate();

    // Fund organizer from provider wallet — no airdrop needed
    await fund(provider, organizer.publicKey, 100 * LAMPORTS_PER_SOL);
  });

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
      const threshold  = 3;
      const tierAmounts = [
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(15 * LAMPORTS_PER_SOL),
        new anchor.BN(10 * LAMPORTS_PER_SOL),
        new anchor.BN(5  * LAMPORTS_PER_SOL),
      ];
      const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      const balanceBefore = await provider.connection.getBalance(organizer.publicKey);

      const tx = await program.methods
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
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

      assert.equal(escrowAccount.organizer.toBase58(), organizer.publicKey.toBase58(), "Organizer should match");
      assert.equal(escrowAccount.judges.length, 5,    "Should have 5 judges");
      assert.equal(escrowAccount.threshold,     3,    "Threshold should be 3");
      assert.equal(escrowAccount.tiers.length,  4,    "Should have 4 prize tiers");
      assert.equal(escrowAccount.deadline.toNumber(), deadline.toNumber(), "Deadline should match");

      for (let i = 0; i < judges.length; i++) {
        assert.equal(escrowAccount.judges[i].toBase58(), judges[i].toBase58(), `Judge ${i + 1} should match`);
      }

      assert.equal(escrowAccount.tiers[0].amount.toNumber(), 20 * LAMPORTS_PER_SOL, "Tier 0 should be 20 SOL");
      assert.equal(escrowAccount.tiers[1].amount.toNumber(), 15 * LAMPORTS_PER_SOL, "Tier 1 should be 15 SOL");
      assert.equal(escrowAccount.tiers[2].amount.toNumber(), 10 * LAMPORTS_PER_SOL, "Tier 2 should be 10 SOL");
      assert.equal(escrowAccount.tiers[3].amount.toNumber(),  5 * LAMPORTS_PER_SOL, "Tier 3 should be 5 SOL");

      escrowAccount.tiers.forEach((tier, index) => {
        assert.isNull(tier.winner,  `Tier ${index} should have no winner yet`);
        assert.isFalse(tier.claimed, `Tier ${index} should be unclaimed`);
      });

      const vaultBalance    = await provider.connection.getBalance(vaultPda);
      const expectedTotal   = 50 * LAMPORTS_PER_SOL;
      assert.equal(vaultBalance, expectedTotal, "Vault should have 50 SOL locked");

      const balanceAfter = await provider.connection.getBalance(organizer.publicKey);
      assert.isAbove(balanceBefore - balanceAfter, expectedTotal, "Organizer should have transferred at least 50 SOL");

      console.log("Escrow initialized successfully!");
      console.log(`   Organizer: ${escrowAccount.organizer.toBase58()}`);
      console.log(`   Judges: ${escrowAccount.judges.length}`);
      console.log(`   Threshold: ${escrowAccount.threshold}`);
      console.log(`   Tiers: ${escrowAccount.tiers.length}`);
      console.log(`   Total locked: ${vaultBalance / LAMPORTS_PER_SOL} SOL`);
    });

    it("Fails to initialize with invalid threshold (too high)", async () => {
      const organizer2 = Keypair.generate();

      // Transfer from organizer instead of airdrop
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
          .initializeEscrow(judges, invalidThreshold, tierAmounts, deadline)
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

      // Transfer from organizer instead of airdrop
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
          .initializeEscrow(judges, threshold, tierAmounts, pastDeadline)
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

      // Transfer from organizer instead of airdrop
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
          .initializeEscrow(emptyJudges, threshold, tierAmounts, deadline)
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

  describe("finalize_winner", () => {

    let escrowPda:           PublicKey;
    let vaultPda:            PublicKey;
    let organizerForFinalize: Keypair;
    let judgesForFinalize:    Keypair[];

    before(async () => {
      organizerForFinalize = Keypair.generate();
      judgesForFinalize = Array.from({ length: 5 }, () => Keypair.generate());

      // Transfer from provider wallet instead of airdrop
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
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
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

      // Transfer from provider wallet instead of airdrop
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
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForClaim.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForClaim])
        .rpc();

      // Finalize winner for tier 0
      await program.methods
        .finalizeWinner(0, winner1.publicKey, mockSigs([1, 2, 3, 0, 0]))
        .accountsPartial({ escrow: escrowPda, organizer: organizerForClaim.publicKey })
        .rpc();

      // Finalize winner for tier 1
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

      // Transfer from organizerForClaim instead of airdrop
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

      // Transfer from provider wallet instead of airdrop
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
        .initializeEscrow(judges, 3, tierAmounts, deadline)
        .accountsPartial({
          escrow:        newEscrowPda,
          vault:         newVaultPda,
          organizer:     newOrganizer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOrganizer])
        .rpc();

      const someWinner = Keypair.generate();

      // Transfer from newOrganizer instead of airdrop
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

      // Transfer from provider wallet instead of airdrop
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
        .initializeEscrow(judges, threshold, tierAmounts, deadline)
        .accountsPartial({
          escrow:        escrowPda,
          vault:         vaultPda,
          organizer:     organizerForRefund.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([organizerForRefund])
        .rpc();

      // Finalize and claim tier 0 only
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

      // Transfer from provider wallet instead of airdrop
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
      const futureDeadline = new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);

      await program.methods
        .initializeEscrow(judges, 3, tierAmounts, futureDeadline)
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

      // Transfer from organizerForRefund instead of airdrop
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

      // Transfer from provider wallet instead of airdrop
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
        .initializeEscrow(judges, 3, tierAmounts, shortDeadline)
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

      // Transfer from provider wallet instead of airdrop
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
        .initializeEscrow(judges, 3, tierAmounts, shortDeadline)
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
