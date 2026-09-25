// An amount in lamports shown as SOL, e.g. "12.5 SOL", with digits that line up in lists.

import { BN } from "@coral-xyz/anchor";
import { formatSol } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  lamports: BN;
  className?: string;
}

export default function SolAmount({ lamports, className }: Props) {
  return (
    <span className={cn("font-semibold tabular-nums text-highlight", className)}>
      {formatSol(lamports)}
    </span>
  );
}
