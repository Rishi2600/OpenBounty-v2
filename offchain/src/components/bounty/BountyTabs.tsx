"use client";

// Tabs on the bounty page (mock mode): Prizes, Submissions, and Judging for the bounty's judges.

import { ReactNode } from "react";
import { PublicKey } from "@solana/web3.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubmissionGallery from "@/components/submissions/SubmissionGallery";
import JudgingBoard from "@/components/judging/JudgingBoard";
import type { SubmissionsState } from "@/hooks/useSubmissions";
import type { PendingAction } from "@/hooks/useBountyActions";
import type { EscrowAccount } from "@/types/escrow";

interface Props {
  escrow: EscrowAccount;
  viewer: PublicKey | null;
  isJudge: boolean;
  prizeList: ReactNode;
  entries: SubmissionsState;
  pending: PendingAction;
  onVote: (tierIndex: number, candidate: PublicKey) => Promise<boolean>;
}

export default function BountyTabs({ escrow, viewer, isJudge, prizeList, entries, pending, onVote }: Props) {
  const count = entries.loading ? "" : ` (${entries.submissions.length})`;
  const showJudging = isJudge && viewer !== null;

  return (
    <Tabs defaultValue="prizes" className="gap-4">
      <TabsList>
        <TabsTrigger value="prizes">Prizes</TabsTrigger>
        <TabsTrigger value="submissions">Submissions{count}</TabsTrigger>
        {showJudging && <TabsTrigger value="judging">Judging</TabsTrigger>}
      </TabsList>

      <TabsContent value="prizes">{prizeList}</TabsContent>

      <TabsContent value="submissions">
        <SubmissionGallery
          escrow={escrow}
          viewer={viewer}
          submissions={entries.submissions}
          loading={entries.loading}
          error={entries.error}
          submitting={entries.submitting}
          onRetry={entries.refetch}
          onSubmitEntry={entries.submitEntry}
          onSubmitted={entries.refetch}
        />
      </TabsContent>

      {showJudging && viewer && (
        <TabsContent value="judging">
          <JudgingBoard
            escrow={escrow}
            judge={viewer}
            submissions={entries.submissions}
            loading={entries.loading}
            pending={pending}
            onVote={onVote}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
