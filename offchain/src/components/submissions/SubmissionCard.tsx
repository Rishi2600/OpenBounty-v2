// One bounty entry: name, submitter, when, description, project link, and how it's
// doing in the vote ("Won 1st prize", "2 votes · 1st prize").

import { PublicKey } from "@solana/web3.js";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Address from "@/components/common/Address";
import type { EscrowAccount } from "@/types/escrow";
import type { Submission } from "@/types/submission";
import { formatTimeAgo, placeLabel } from "@/utils/format";
import { safeDetailsUrl } from "@/utils/address";
import { votesPerTier, wonTiers } from "@/utils/submissions";

interface Props {
  submission: Submission;
  escrow: EscrowAccount;
  viewer: PublicKey | null;
}

export default function SubmissionCard({ submission, escrow, viewer }: Props) {
  const link = safeDetailsUrl(submission.url);
  const won = wonTiers(escrow, submission.submitter);
  const votes = votesPerTier(escrow, submission.submitter);
  const isYou = viewer !== null && submission.submitter.equals(viewer);

  return (
    <Card className="gap-3 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-snug">{submission.title}</h3>
        <span className="text-sm text-muted-foreground">{formatTimeAgo(submission.submittedAt)}</span>
      </div>

      <Address address={submission.submitter.toBase58()} isYou={isYou} />

      {submission.description && <p className="text-muted-foreground">{submission.description}</p>}

      <div className="flex flex-wrap gap-1.5">
        {won.map((tierIndex) => (
          <Badge key={`won-${tierIndex}`} variant="outline" className="border-success/40 text-success">
            Won {placeLabel(tierIndex)}
          </Badge>
        ))}
        {votes.map((count, tierIndex) => {
          const decided = escrow.tiers[tierIndex].winner !== null;
          if (count === 0 || decided) return null;
          return (
            <Badge key={`votes-${tierIndex}`} variant="outline">
              {count} {count === 1 ? "vote" : "votes"} · {placeLabel(tierIndex)}
            </Badge>
          );
        })}
      </div>

      {link && (
        <Button asChild variant="outline" className="mt-auto self-start">
          <a href={link} target="_blank" rel="noreferrer">
            View project <ExternalLink aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      )}
    </Card>
  );
}
