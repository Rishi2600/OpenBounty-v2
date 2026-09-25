"use client";

// The bounty detail page: title and status, prizes with voting and claiming,
// a refund panel for the organizer after the deadline, and the details panel.

import { useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ArrowLeft, CircleCheck, SearchX, Undo2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import BountyDetailSkeleton from "./BountyDetailSkeleton";
import BountyDetailsPanel from "./BountyDetailsPanel";
import BountyStatusBadge from "./BountyStatusBadge";
import RefundDialog from "./RefundDialog";
import RoleBadges from "./RoleBadges";
import TierCard from "./TierCard";
import VoteDialog from "./VoteDialog";
import { useEscrow } from "@/hooks/useEscrow";
import { useBountyActions } from "@/hooks/useBountyActions";
import { formatDeadline, formatSol, placeLabel, unclaimedTotal } from "@/utils/format";
import { countDecidedTiers, getBountyStatus, getCandidateTallies } from "@/utils/status";
import { getViewerRoles } from "@/utils/roles";
import { toastTxError, toastTxSuccess } from "@/utils/txToast";

interface Props {
  address: string;
}

export default function BountyDetail({ address }: Props) {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { escrow, loading, error, refetch } = useEscrow(address);
  const { vote, claim, refund, pending } = useBountyActions(escrow);
  const [voteTier, setVoteTier] = useState<number | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);

  // Keep showing the bounty while it refreshes after a transaction
  if (loading && !escrow) return <BountyDetailSkeleton />;
  if (error) return <ErrorState message="Couldn't load this bounty from devnet." onRetry={refetch} />;

  if (!escrow && closedMessage) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Bounty closed"
        description={closedMessage}
        action={<Button asChild><Link href="/">Explore bounties</Link></Button>}
      />
    );
  }
  if (!escrow) {
    return (
      <EmptyState
        icon={SearchX}
        title="Bounty not found"
        description="The link may be wrong, or the bounty closed after every prize was claimed or refunded."
        action={<Button asChild variant="outline"><Link href="/">Explore bounties</Link></Button>}
      />
    );
  }

  const status = getBountyStatus(escrow.deadline);
  const isEnded = status === "ended";
  const roles = getViewerRoles(escrow, publicKey);
  const unclaimed = unclaimedTotal(escrow.tiers);
  const canRefund = roles.isOrganizer && isEnded && !unclaimed.isZero();
  const decided = countDecidedTiers(escrow.tiers);

  async function handleVote(candidate: PublicKey) {
    if (voteTier === null) return;
    try {
      const signature = await vote(voteTier, candidate);
      toastTxSuccess("Vote recorded", signature);
      setVoteTier(null);
      refetch();
    } catch (err) {
      toastTxError(err);
    }
  }

  async function handleClaim(tierIndex: number) {
    if (!escrow) return;
    const amount = formatSol(escrow.tiers[tierIndex].amount);
    const isLastUnclaimed = escrow.tiers.filter((tier) => !tier.claimed).length === 1;
    try {
      const signature = await claim(tierIndex);
      toastTxSuccess(`Claimed ${amount}`, signature);
      if (isLastUnclaimed) setClosedMessage(`You claimed ${amount}. That was the last prize, so the bounty is now closed.`);
      refetch();
    } catch (err) {
      toastTxError(err);
    }
  }

  async function handleRefund() {
    const amount = formatSol(unclaimed);
    try {
      const signature = await refund();
      toastTxSuccess(`Refunded ${amount}`, signature);
      setRefundOpen(false);
      setClosedMessage(`${amount} went back to your wallet and the bounty is now closed.`);
      refetch();
    } catch (err) {
      toastTxError(err);
    }
  }

  return (
    <div className="flex flex-col gap-8">
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

      {!publicKey && (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm">Judge or winner? Connect your wallet to vote or claim.</p>
          <Button variant="outline" onClick={() => setVisible(true)}>
            <Wallet /> Connect wallet
          </Button>
        </Card>
      )}

      {canRefund && (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4 ring-destructive/40">
          <p className="text-sm">
            The deadline has passed. You can refund the {formatSol(unclaimed)} nobody claimed.
          </p>
          <Button variant="destructive" onClick={() => setRefundOpen(true)}>
            <Undo2 /> Refund {formatSol(unclaimed)}
          </Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section aria-labelledby="prizes-heading" className="flex flex-col gap-4">
          <h2 id="prizes-heading" className="font-display text-2xl">Prizes</h2>
          {escrow.tiers.map((_, index) => (
            <TierCard
              key={index}
              escrow={escrow}
              tierIndex={index}
              viewer={publicKey}
              isEnded={isEnded}
              pending={pending}
              onVote={setVoteTier}
              onClaim={handleClaim}
            />
          ))}
        </section>
        <BountyDetailsPanel escrow={escrow} viewer={publicKey} />
      </div>

      <VoteDialog
        open={voteTier !== null}
        prizeLabel={placeLabel(voteTier ?? 0)}
        threshold={escrow.threshold}
        tallies={voteTier === null ? [] : getCandidateTallies(escrow.tiers[voteTier])}
        submitting={pending !== null && pending.startsWith("vote")}
        onOpenChange={(open) => { if (!open) setVoteTier(null); }}
        onSubmit={handleVote}
      />
      <RefundDialog
        open={refundOpen}
        amountText={formatSol(unclaimed)}
        submitting={pending === "refund"}
        onOpenChange={setRefundOpen}
        onConfirm={handleRefund}
      />
    </div>
  );
}
