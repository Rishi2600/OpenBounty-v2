import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import type { EscrowAccount } from "@/types/escrow";
import { deriveEscrowPda } from "@/utils/pda";
import { buildMockEscrows } from "./fixtures";

// Mock mode: run `yarn dev:mock` (sets NEXT_PUBLIC_MOCK=1).
// Hooks then read and write the in-memory data below instead of devnet,
// and no transactions are sent.
export const USE_MOCKS = process.env.NEXT_PUBLIC_MOCK === "1";

// Bounties created during this browser session. Cleared on page reload.
const created: EscrowAccount[] = [];

export function getMockEscrows(viewer: PublicKey | null): EscrowAccount[] {
  return [...buildMockEscrows(viewer), ...created];
}

export interface NewMockEscrow {
  title: string;
  metadataUri: string;
  organizer: PublicKey;
  judges: PublicKey[];
  threshold: number;
  tierAmounts: BN[];
  deadline: BN;
}

export function addMockEscrow(input: NewMockEscrow): void {
  // Next free nonce for this organizer, same idea as findNextNonce on-chain
  const nonce = getMockEscrows(input.organizer)
    .filter((e) => e.organizer.equals(input.organizer))
    .length;

  created.push({
    publicKey:   deriveEscrowPda(input.organizer, nonce)[0],
    title:       input.title,
    metadataUri: input.metadataUri,
    organizer:   input.organizer,
    nonce,
    judges:      input.judges,
    threshold:   input.threshold,
    tiers:       input.tierAmounts.map((amount) => ({
      amount,
      winner:  null,
      claimed: false,
      votes:   [],
    })),
    deadline:    input.deadline,
    bump:        255,
    vaultBump:   255,
  });
}

// Short wait so loading states are visible while testing
export function mockDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clearly fake signature, so it's never mistaken for a real transaction
export function mockSignature(): string {
  return `mock-tx-${Date.now()}`;
}
