// What the connected wallet needs to do across all bounties, for the "Your bounties" page.

import { PublicKey } from "@solana/web3.js";
import type { EscrowAccount } from "@/types/escrow";
import { unclaimedTotal } from "./format";
import { getBountyStatus } from "./status";

export interface TierTask {
  escrow: EscrowAccount;
  tierIndex: number;
}

export interface ViewerTasks {
  toVote: TierTask[];           // you judge, voting is open, no winner yet, you haven't voted
  toClaim: TierTask[];          // you won and haven't claimed
  toRefund: EscrowAccount[];    // you organize, the deadline passed, prizes are unclaimed
  organizing: EscrowAccount[];
  judging: EscrowAccount[];
}

export function getViewerTasks(escrows: EscrowAccount[], viewer: PublicKey): ViewerTasks {
  const tasks: ViewerTasks = { toVote: [], toClaim: [], toRefund: [], organizing: [], judging: [] };

  for (const escrow of escrows) {
    const isEnded = getBountyStatus(escrow.deadline) === "ended";
    const isOrganizer = escrow.organizer.equals(viewer);
    const isJudge = escrow.judges.some((judge) => judge.equals(viewer));

    if (isOrganizer) tasks.organizing.push(escrow);
    if (isJudge) tasks.judging.push(escrow);
    if (isOrganizer && isEnded && !unclaimedTotal(escrow.tiers).isZero()) tasks.toRefund.push(escrow);

    escrow.tiers.forEach((tier, tierIndex) => {
      const hasVoted = tier.votes.some((vote) => vote.judge.equals(viewer));
      const isWinner = tier.winner !== null && tier.winner.equals(viewer);

      if (isJudge && !isEnded && !tier.winner && !hasVoted) tasks.toVote.push({ escrow, tierIndex });
      if (isWinner && !tier.claimed) tasks.toClaim.push({ escrow, tierIndex });
    });
  }

  return tasks;
}
