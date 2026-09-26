"use client";

// "Your bounties": what needs you (votes, claims, refunds) and the bounties you
// organize or judge. Asks you to connect a wallet first.

import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CircleCheck, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import StatCard from "@/components/common/StatCard";
import BountyCardSkeleton from "@/components/bounty/BountyCardSkeleton";
import BountyGridSection from "./BountyGridSection";
import TaskRow from "./TaskRow";
import TaskSection from "./TaskSection";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useProgram } from "@/hooks/useProgram";
import { formatAmount, formatDeadline, formatTotals, placeLabel, unclaimedTotal } from "@/utils/format";
import { getViewerTasks } from "@/utils/tasks";

function bountyHref(address: PublicKey): string {
  return `/bounty/${address.toBase58()}`;
}

export default function MyBounties() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useProgram();
  const { escrows, loading, error, refetch } = useAllEscrows(program);

  const header = (
    <PageHeader title="Your bounties" description="What needs you, and the bounties you run or judge." />
  );

  if (!publicKey) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <EmptyState
          icon={Wallet}
          title="Connect your wallet"
          description="See the bounties you organize, judge or won."
          action={<Button onClick={() => setVisible(true)}><Wallet /> Connect wallet</Button>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div aria-busy className="flex flex-col gap-10">
        {header}
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <BountyCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <ErrorState message="Couldn't load bounties from devnet." onRetry={refetch} />
      </div>
    );
  }

  const tasks = getViewerTasks(escrows, publicKey);
  // Prizes can be in different assets, so this is one total per asset
  const claimTotal = formatTotals(
    tasks.toClaim.map((task) => ({
      amount: task.escrow.tiers[task.tierIndex].amount,
      asset: task.escrow.asset,
    }))
  );
  const todoCount = tasks.toVote.length + tasks.toClaim.length + tasks.toRefund.length;

  return (
    <div className="flex flex-col gap-10">
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Organizing" value={tasks.organizing.length} />
        <StatCard label="Judging" value={tasks.judging.length} />
        <StatCard label="Ready to claim" value={<span className="text-highlight">{claimTotal}</span>} />
      </div>

      {todoCount === 0 && (
        <EmptyState
          icon={CircleCheck}
          title="Nothing needs you right now"
          description="Votes, claims and refunds will show up here."
        />
      )}

      <TaskSection title="Needs your vote" count={tasks.toVote.length}>
        {tasks.toVote.map(({ escrow, tierIndex }) => (
          <TaskRow
            key={`${escrow.publicKey.toBase58()}-${tierIndex}`}
            href={bountyHref(escrow.publicKey)}
            title={escrow.title}
            detail={`${placeLabel(tierIndex)} · ${formatAmount(escrow.tiers[tierIndex].amount, escrow.asset)} · ${formatDeadline(escrow.deadline)}`}
            actionLabel="Vote"
          />
        ))}
      </TaskSection>

      <TaskSection title="Ready to claim" count={tasks.toClaim.length}>
        {tasks.toClaim.map(({ escrow, tierIndex }) => (
          <TaskRow
            key={`${escrow.publicKey.toBase58()}-${tierIndex}`}
            href={bountyHref(escrow.publicKey)}
            title={escrow.title}
            detail={`${placeLabel(tierIndex)} · ${formatAmount(escrow.tiers[tierIndex].amount, escrow.asset)}`}
            actionLabel="Claim"
          />
        ))}
      </TaskSection>

      <TaskSection title="Refund available" count={tasks.toRefund.length}>
        {tasks.toRefund.map((escrow) => (
          <TaskRow
            key={escrow.publicKey.toBase58()}
            href={bountyHref(escrow.publicKey)}
            title={escrow.title}
            detail={`${formatAmount(unclaimedTotal(escrow.tiers), escrow.asset)} unclaimed · ${formatDeadline(escrow.deadline)}`}
            actionLabel="Refund"
          />
        ))}
      </TaskSection>

      <BountyGridSection
        title="Organizing"
        escrows={tasks.organizing}
        viewer={publicKey}
        emptyText="You haven't created a bounty yet."
        emptyAction={<Button asChild variant="outline"><Link href="/create"><Plus /> Create bounty</Link></Button>}
      />
      <BountyGridSection
        title="Judging"
        escrows={tasks.judging}
        viewer={publicKey}
        emptyText="You're not judging any bounties."
      />
    </div>
  );
}
