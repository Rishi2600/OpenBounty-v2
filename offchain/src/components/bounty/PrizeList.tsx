// The prize tiers of a bounty as a stack of TierCards.

import { PublicKey } from "@solana/web3.js";
import TierCard from "./TierCard";
import type { EscrowAccount } from "@/types/escrow";
import type { PendingAction } from "@/hooks/useBountyActions";

interface Props {
  escrow: EscrowAccount;
  viewer: PublicKey | null;
  isEnded: boolean;
  pending: PendingAction;
  onVote: (tierIndex: number) => void;
  onClaim: (tierIndex: number) => void;
}

export default function PrizeList({ escrow, viewer, isEnded, pending, onVote, onClaim }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {escrow.tiers.map((_, index) => (
        <TierCard
          key={index}
          escrow={escrow}
          tierIndex={index}
          viewer={viewer}
          isEnded={isEnded}
          pending={pending}
          onVote={onVote}
          onClaim={onClaim}
        />
      ))}
    </div>
  );
}
