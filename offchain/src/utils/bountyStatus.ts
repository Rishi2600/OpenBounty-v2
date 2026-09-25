// Old status logic, still used by the old dashboard (app/page.tsx, dashboard/BountyCard).
// Delete this file when the Explore page replaces them. New code uses utils/status.ts.

import { BN } from "@coral-xyz/anchor";
import type { PrizeTier } from "@/types/escrow";

export type BountyStatus = "active" | "claimed" | "expired";

export function deriveBountyStatus(tiers: PrizeTier[], deadline: BN): BountyStatus {
  const nowSec = Math.floor(Date.now() / 1000);
  if (tiers.every((t) => t.claimed)) return "claimed";
  if (nowSec > deadline.toNumber()) return "expired";
  return "active";
}
