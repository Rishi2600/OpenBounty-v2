import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import type { EscrowAccount } from "@/types/escrow";
import type { AssetId } from "@/constants/assets";
import { deriveEscrowPda } from "@/utils/pda";
import { buildMockEscrows } from "./fixtures";

// Mock mode: run `yarn dev:mock` (sets NEXT_PUBLIC_MOCK=1).
// Hooks then read and write the in-memory data below instead of devnet,
// and no transactions are sent. Everything resets on page reload.
export { USE_MOCKS } from "./config";

// Samples are built around the connected wallet and rebuilt if it changes
let samples: EscrowAccount[] = [];
let samplesBuiltFor: string | null = null;

// Bounties created during this session
const created: EscrowAccount[] = [];

export function getMockEscrows(viewer: PublicKey | null): EscrowAccount[] {
  const key = viewer ? viewer.toBase58() : "logged-out";
  if (samplesBuiltFor !== key) {
    samples = buildMockEscrows(viewer);
    samplesBuiltFor = key;
  }
  return [...samples, ...created];
}

// The stored escrow itself, for mock actions to change
export function findMockEscrow(address: PublicKey): EscrowAccount | undefined {
  return [...samples, ...created].find((e) => e.publicKey.equals(address));
}

// A copy of one escrow, so React sees a new object after a mock action changes it
export function getMockEscrowCopy(viewer: PublicKey | null, address: PublicKey): EscrowAccount | null {
  const escrow = getMockEscrows(viewer).find((e) => e.publicKey.equals(address));
  if (!escrow) return null;
  return {
    ...escrow,
    tiers: escrow.tiers.map((tier) => ({ ...tier, votes: [...tier.votes] })),
  };
}

// Like the program closing the account after the last claim or a refund
export function removeMockEscrow(address: PublicKey): void {
  samples = samples.filter((e) => !e.publicKey.equals(address));
  const index = created.findIndex((e) => e.publicKey.equals(address));
  if (index !== -1) created.splice(index, 1);
}

export interface NewMockEscrow {
  asset: AssetId;
  title: string;
  metadataUri: string;
  organizer: PublicKey;
  judges: PublicKey[];
  threshold: number;
  tierAmounts: BN[];
  deadline: BN;
}

// Returns the new escrow address
export function addMockEscrow(input: NewMockEscrow): PublicKey {
  // Next free nonce for this organizer, same idea as findNextNonce on-chain
  const nonce = getMockEscrows(input.organizer)
    .filter((e) => e.organizer.equals(input.organizer))
    .length;

  const address = deriveEscrowPda(input.organizer, nonce)[0];
  created.push({
    publicKey:   address,
    title:       input.title,
    metadataUri: input.metadataUri,
    organizer:   input.organizer,
    asset:       input.asset,
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
  return address;
}

// Short wait so loading states are visible while testing
export function mockDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clearly fake signature, so it's never mistaken for a real transaction
export function mockSignature(): string {
  return `mock-tx-${Date.now()}`;
}
