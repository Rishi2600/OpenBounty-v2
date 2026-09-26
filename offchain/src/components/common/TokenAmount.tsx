// An amount in an asset's base units shown as text, e.g. "12.5 SOL" or "2,500 USDC",
// in the highlight color with digits that line up in lists.

import { BN } from "@coral-xyz/anchor";
import type { AssetId } from "@/constants/assets";
import { formatAmount } from "@/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  amount: BN;
  asset: AssetId;
  className?: string;
}

export default function TokenAmount({ amount, asset, className }: Props) {
  return (
    <span className={cn("font-semibold tabular-nums text-highlight", className)}>
      {formatAmount(amount, asset)}
    </span>
  );
}
