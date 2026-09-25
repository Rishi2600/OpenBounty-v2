// What the connected wallet ("viewer") is on a bounty: organizer, judge, and/or winner.

import { PublicKey } from "@solana/web3.js";
import type { EscrowAccount } from "@/types/escrow";

export interface ViewerRoles {
  isOrganizer: boolean;
  isJudge: boolean;
  wonTiers: number[]; // indexes of tiers this wallet won
}

export function getViewerRoles(escrow: EscrowAccount, viewer: PublicKey | null): ViewerRoles {
  const roles: ViewerRoles = { isOrganizer: false, isJudge: false, wonTiers: [] };
  if (!viewer) return roles;

  roles.isOrganizer = escrow.organizer.equals(viewer);
  roles.isJudge = escrow.judges.some((judge) => judge.equals(viewer));

  escrow.tiers.forEach((tier, index) => {
    if (tier.winner && tier.winner.equals(viewer)) roles.wonTiers.push(index);
  });

  return roles;
}
