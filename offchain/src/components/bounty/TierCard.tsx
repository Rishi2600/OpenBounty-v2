"use client";

// One prize on the bounty detail page: amount, status, vote progress or winner,
// and the action for your role (judges vote, the winner claims).

import { PublicKey } from "@solana/web3.js";
import { Loader2, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Address from "@/components/common/Address";
import SolAmount from "@/components/common/SolAmount";
import TierStatusBadge from "./TierStatusBadge";
import type { EscrowAccount } from "@/types/escrow";
import { formatSol, placeLabel } from "@/utils/format";
import { getCandidateTallies, getTierProgress } from "@/utils/status";
import type { PendingAction } from "@/hooks/useBountyActions";

interface Props {
  escrow: EscrowAccount;
  tierIndex: number;
  viewer: PublicKey | null;
  isEnded: boolean;
  pending: PendingAction;
  onVote: (tierIndex: number) => void;
  onClaim: (tierIndex: number) => void;
}

export default function TierCard({ escrow, tierIndex, viewer, isEnded, pending, onVote, onClaim }: Props) {
  const tier = escrow.tiers[tierIndex];
  const progress = getTierProgress(tier);
  const tallies = getCandidateTallies(tier);

  const isJudge = viewer !== null && escrow.judges.some((judge) => judge.equals(viewer));
  const myVote = viewer ? tier.votes.find((vote) => vote.judge.equals(viewer)) : undefined;
  const isMyPrize = viewer !== null && tier.winner !== null && tier.winner.equals(viewer);

  const canVote = isJudge && !myVote && !tier.winner && !isEnded;
  const canClaim = isMyPrize && !tier.claimed;
  const claiming = pending === `claim-${tierIndex}`;
  const voting = pending === `vote-${tierIndex}`;

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {placeLabel(tierIndex)}
          </span>
          <SolAmount lamports={tier.amount} className="text-2xl" />
        </div>
        <TierStatusBadge progress={progress} threshold={escrow.threshold} isEnded={isEnded} />
      </div>

      {tier.winner && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Winner</span>
          <Address address={tier.winner.toBase58()} isYou={isMyPrize} />
        </div>
      )}

      {!tier.winner && isEnded && (
        <p className="text-sm text-muted-foreground">Voting closed without a winner.</p>
      )}

      {!tier.winner && !isEnded && (
        <div className="flex flex-col gap-2">
          <Progress
            value={(progress.leadingVotes / escrow.threshold) * 100}
            aria-label={`Leading candidate has ${progress.leadingVotes} of ${escrow.threshold} votes needed`}
          />
          {tallies.length === 0 && (
            <p className="text-sm text-muted-foreground">No votes yet.</p>
          )}
          {tallies.map((tally) => (
            <div key={tally.candidate.toBase58()} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Address address={tally.candidate.toBase58()} isYou={viewer !== null && tally.candidate.equals(viewer)} />
              <span className="tabular-nums text-muted-foreground">
                {tally.votes} {tally.votes === 1 ? "vote" : "votes"}
              </span>
            </div>
          ))}
        </div>
      )}

      {myVote && !tier.winner && (
        <p className="text-sm text-muted-foreground">
          You voted for <span className="font-mono">{myVote.candidate.toBase58().slice(0, 4)}...</span>
        </p>
      )}

      {canVote && (
        <Button variant="outline" className="self-start" onClick={() => onVote(tierIndex)} disabled={voting}>
          {voting ? <Loader2 className="animate-spin" /> : <Vote />}
          {voting ? "Confirming..." : "Vote for a winner"}
        </Button>
      )}

      {canClaim && (
        <Button className="self-start" onClick={() => onClaim(tierIndex)} disabled={claiming}>
          {claiming && <Loader2 className="animate-spin" />}
          {claiming ? "Confirming..." : `Claim ${formatSol(tier.amount)}`}
        </Button>
      )}
    </Card>
  );
}
