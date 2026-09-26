"use client";

// The bounty detail page: header, notices, and tabs for Prizes and Submissions (entries,
// mock mode) next to the details panel. Owns the vote, claim and refund handlers so
// every tab and dialog shares them.

import { useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { CircleCheck, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SubmissionGallery from "@/components/submissions/SubmissionGallery";
import BountyDetailSkeleton from "./BountyDetailSkeleton";
import BountyDetailsPanel from "./BountyDetailsPanel";
import BountyHeader from "./BountyHeader";
import BountyNotices from "./BountyNotices";
import ClaimDialog from "./ClaimDialog";
import PrizeList from "./PrizeList";
import RefundDialog from "./RefundDialog";
import VoteDialog from "./VoteDialog";
import { useEscrow } from "@/hooks/useEscrow";
import { useBountyActions } from "@/hooks/useBountyActions";
import { useSubmissions } from "@/hooks/useSubmissions";
import { ASSETS } from "@/constants/assets";
import { CHAINS } from "@/constants/chains";
import { SUBMISSIONS_PREVIEW } from "@/constants/submissions";
import type { Payout } from "@/types/escrow";
import { formatAmount, placeLabel, unclaimedTotal } from "@/utils/format";
import { getBountyStatus } from "@/utils/status";
import { getViewerRoles } from "@/utils/roles";
import { getVoteCandidates } from "@/utils/submissions";
import { toastTxError, toastTxSuccess } from "@/utils/txToast";

interface Props {
  address: string;
}

export default function BountyDetail({ address }: Props) {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { escrow, loading, error, refetch } = useEscrow(address);
  const { vote, claim, refund, pending } = useBountyActions(escrow);
  const entries = useSubmissions(escrow);
  const [voteTier, setVoteTier] = useState<number | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [claimDialogTier, setClaimDialogTier] = useState<number | null>(null);
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

  // The bounty and its entries refresh together after any change
  function refreshAll() {
    refetch();
    entries.refetch();
  }

  // Shared by the vote dialog (and the judging board). Returns true on success.
  async function castVote(tierIndex: number, candidate: PublicKey): Promise<boolean> {
    try {
      const signature = await vote(tierIndex, candidate);
      toastTxSuccess("Vote recorded", signature);
      refreshAll();
      return true;
    } catch (err) {
      toastTxError(err);
      return false;
    }
  }

  async function handleVote(candidate: PublicKey) {
    if (voteTier === null) return;
    if (await castVote(voteTier, candidate)) setVoteTier(null);
  }

  // Sends the claim; `payout` is set when the winner picked a destination chain.
  // Returns true on success. The caller decides when to refresh.
  async function claimTier(tierIndex: number, payout?: Payout): Promise<boolean> {
    if (!escrow) return false;
    const amount = formatAmount(escrow.tiers[tierIndex].amount, escrow.asset);
    const where = payout && payout.chain !== "solana" ? ` on ${CHAINS[payout.chain].name}` : "";
    const isLastUnclaimed = escrow.tiers.filter((tier) => !tier.claimed).length === 1;
    try {
      const signature = await claim(tierIndex, payout);
      toastTxSuccess(`Claimed ${amount}${where}`, signature);
      if (isLastUnclaimed) setClosedMessage(`You claimed ${amount}${where}. That was the last prize, so the bounty is now closed.`);
      return true;
    } catch (err) {
      toastTxError(err);
      return false;
    }
  }

  // Multichain assets (USDC) open the claim dialog; others pay the Solana wallet directly
  async function handleClaim(tierIndex: number) {
    if (!escrow) return;
    if (ASSETS[escrow.asset].crossChain) {
      setClaimDialogTier(tierIndex);
      return;
    }
    if (await claimTier(tierIndex)) refreshAll();
  }

  async function handleRefund() {
    if (!escrow) return;
    const amount = formatAmount(unclaimed, escrow.asset);
    try {
      const signature = await refund();
      toastTxSuccess(`Refunded ${amount}`, signature);
      setRefundOpen(false);
      setClosedMessage(`${amount} went back to your wallet and the bounty is now closed.`);
      refreshAll();
    } catch (err) {
      toastTxError(err);
    }
  }

  const prizeList = (
    <PrizeList
      escrow={escrow}
      viewer={publicKey}
      isEnded={isEnded}
      pending={pending}
      onVote={setVoteTier}
      onClaim={handleClaim}
    />
  );
  const entryCount = entries.loading ? "" : ` (${entries.submissions.length})`;

  return (
    <div className="flex flex-col gap-8">
      <BountyHeader escrow={escrow} status={status} roles={roles} />
      <BountyNotices
        showConnect={!publicKey}
        refundText={canRefund ? formatAmount(unclaimed, escrow.asset) : null}
        onConnect={() => setVisible(true)}
        onRefund={() => setRefundOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        {SUBMISSIONS_PREVIEW && (
          <Tabs defaultValue="prizes" className="gap-4">
            <TabsList>
              <TabsTrigger value="prizes">Prizes</TabsTrigger>
              <TabsTrigger value="submissions">Submissions{entryCount}</TabsTrigger>
            </TabsList>
            <TabsContent value="prizes">{prizeList}</TabsContent>
            <TabsContent value="submissions">
              <SubmissionGallery
                escrow={escrow}
                viewer={publicKey}
                submissions={entries.submissions}
                loading={entries.loading}
                error={entries.error}
                submitting={entries.submitting}
                onRetry={entries.refetch}
                onSubmitEntry={entries.submitEntry}
                onSubmitted={entries.refetch}
              />
            </TabsContent>
          </Tabs>
        )}
        {!SUBMISSIONS_PREVIEW && (
          <section aria-labelledby="prizes-heading" className="flex flex-col gap-4">
            <h2 id="prizes-heading" className="font-display text-2xl">Prizes</h2>
            {prizeList}
          </section>
        )}
        <BountyDetailsPanel escrow={escrow} viewer={publicKey} />
      </div>

      <VoteDialog
        open={voteTier !== null}
        prizeLabel={placeLabel(voteTier ?? 0)}
        threshold={escrow.threshold}
        candidates={voteTier === null ? [] : getVoteCandidates(escrow.tiers[voteTier], entries.submissions)}
        submitting={pending !== null && pending.startsWith("vote")}
        onOpenChange={(open) => { if (!open) setVoteTier(null); }}
        onSubmit={handleVote}
      />
      {publicKey && (
        <ClaimDialog
          open={claimDialogTier !== null}
          amountText={claimDialogTier === null ? "" : formatAmount(escrow.tiers[claimDialogTier].amount, escrow.asset)}
          walletAddress={publicKey.toBase58()}
          submitting={pending !== null && pending.startsWith("claim")}
          onOpenChange={(open) => {
            // Refresh only after the dialog closes, so its transfer steps can finish showing
            if (!open) {
              setClaimDialogTier(null);
              refreshAll();
            }
          }}
          onClaim={(payout) => claimTier(claimDialogTier ?? 0, payout)}
        />
      )}
      <RefundDialog
        open={refundOpen}
        amountText={formatAmount(unclaimed, escrow.asset)}
        submitting={pending === "refund"}
        onOpenChange={setRefundOpen}
        onConfirm={handleRefund}
      />
    </div>
  );
}
