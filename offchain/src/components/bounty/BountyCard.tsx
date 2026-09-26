// One bounty in a grid: title, status, prize pool, your role, prizes decided and deadline.
// The whole card links to the bounty's detail page.

import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { Clock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import TokenAmount from "@/components/common/TokenAmount";
import BountyStatusBadge from "./BountyStatusBadge";
import RoleBadges from "./RoleBadges";
import type { EscrowAccount } from "@/types/escrow";
import { formatDeadline, totalLocked } from "@/utils/format";
import { countDecidedTiers, getBountyStatus } from "@/utils/status";
import { getViewerRoles } from "@/utils/roles";
import { cn } from "@/lib/utils";

interface Props {
  escrow: EscrowAccount;
  viewer: PublicKey | null; // connected wallet, used to show your role
}

export default function BountyCard({ escrow, viewer }: Props) {
  const status = getBountyStatus(escrow.deadline);
  const roles = getViewerRoles(escrow, viewer);
  const decided = countDecidedTiers(escrow.tiers);
  const prizeCount = escrow.tiers.length;

  return (
    <Link
      href={`/bounty/${escrow.publicKey.toBase58()}`}
      className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card
        className={cn(
          "h-full gap-4 px-5 py-5 transition-shadow duration-200 group-hover:ring-primary/50",
          roles.isOrganizer && "shadow-glow ring-primary/40"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-display text-lg leading-snug">{escrow.title}</h3>
          <BountyStatusBadge status={status} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prize pool
          </span>
          <TokenAmount amount={totalLocked(escrow.tiers)} asset={escrow.asset} className="text-3xl" />
        </div>

        <RoleBadges roles={roles} />

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="size-4" aria-hidden />
            {decided} of {prizeCount} {prizeCount === 1 ? "prize" : "prizes"} decided
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {formatDeadline(escrow.deadline)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
