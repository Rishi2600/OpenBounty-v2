import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { OpenbountyV2 } from "../target/types/openbounty_v2";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OpenbountyV2 as Program<OpenbountyV2>;
  const organizer = provider.wallet;

  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), organizer.publicKey.toBuffer()],
    program.programId,
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), organizer.publicKey.toBuffer()],
    program.programId,
  );

  const judges = [
    new PublicKey("11111111111111111111111111111111"),
    new PublicKey("CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL"),
  ];

  const tx = await program.methods
    .initializeEscrow(
      "ETHIndia 2024",
      "ipfs://QmTestMetadata",
      judges,
      2,
      [
        new anchor.BN(2 * LAMPORTS_PER_SOL),
        new anchor.BN(1 * LAMPORTS_PER_SOL),
      ],
      new anchor.BN(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
    )
    .accountsPartial({
      escrow: escrowPda,
      vault: vaultPda,
      organizer: organizer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Escrow created:", tx);
  console.log("Escrow PDA:", escrowPda.toBase58());
}

main().catch(console.error);