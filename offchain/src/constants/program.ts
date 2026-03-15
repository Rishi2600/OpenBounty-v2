import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL"
);

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