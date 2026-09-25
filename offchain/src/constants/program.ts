import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL"
);

// Must match Escrow::LEN in onchain/programs/openbounty_v2/src/state/escrow.rs.
// Used to skip leftover v1 escrow accounts, which share the discriminator
// but have a different layout and would fail to decode.
export const ESCROW_ACCOUNT_SIZE = 1842;

export const CLUSTER_URL = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

export const EXPLORER_BASE = {
  devnet: "https://explorer.solana.com/tx",
  mainnet: "https://explorer.solana.com/tx",
};

export const explorerUrl = (
  signature: string,
  cluster: "devnet" | "mainnet" = "devnet"
) => `${EXPLORER_BASE[cluster]}/${signature}?cluster=${cluster}`;

export const explorerAddressUrl = (
  address: string,
  cluster: "devnet" | "mainnet" = "devnet"
) => `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
