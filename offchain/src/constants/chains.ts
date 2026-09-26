// Chains a USDC prize can be paid out on in the multichain preview. The real flow would
// use Circle CCTP: burn USDC on Solana, then mint the same amount of native USDC on the
// destination chain. `cctpDomain` is CCTP's number for each chain.

export type ChainId = "solana" | "base" | "ethereum" | "arbitrum";

export interface Chain {
  id: ChainId;
  name: string;
  cctpDomain: number;
  addressFormat: "solana" | "evm";   // what kind of address the winner enters
}

export const CHAINS: Record<ChainId, Chain> = {
  solana:   { id: "solana",   name: "Solana",   cctpDomain: 5, addressFormat: "solana" },
  base:     { id: "base",     name: "Base",     cctpDomain: 6, addressFormat: "evm" },
  ethereum: { id: "ethereum", name: "Ethereum", cctpDomain: 0, addressFormat: "evm" },
  arbitrum: { id: "arbitrum", name: "Arbitrum", cctpDomain: 3, addressFormat: "evm" },
};

export const CHAIN_IDS: ChainId[] = ["solana", "base", "ethereum", "arbitrum"];
