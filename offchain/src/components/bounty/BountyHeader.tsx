// Top of the bounty page: back link, status and your roles, title, and progress line.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BountyStatusBadge from "./BountyStatusBadge";
import RoleBadges from "./RoleBadges";
import type { EscrowAccount } from "@/types/escrow";
import type { BountyStatus } from "@/utils/status";
import type { ViewerRoles } from "@/utils/roles";
import { formatDeadline } from "@/utils/format";
import { countDecidedTiers } from "@/utils/status";

interface Props {
  escrow: EscrowAccount;
  status: BountyStatus;
  roles: ViewerRoles;
}

export default function BountyHeader({ escrow, status, roles }: Props) {
  const decided = countDecidedTiers(escrow.tiers);

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All bounties
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <BountyStatusBadge status={status} />
          <RoleBadges roles={roles} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl">{escrow.title}</h1>
        <p className="text-muted-foreground">
          {decided} of {escrow.tiers.length} prizes decided · {formatDeadline(escrow.deadline)}
        </p>
      </div>
    </>
  );
}
