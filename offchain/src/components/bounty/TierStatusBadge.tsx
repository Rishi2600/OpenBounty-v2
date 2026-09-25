// Badge with a prize tier's status: Awaiting votes, Voting · 2 of 3, Winner picked, Claimed,
// or No winner (the deadline passed before anyone reached the threshold).

import { Badge } from "@/components/ui/badge";
import type { TierProgress } from "@/utils/status";

interface Props {
  progress: TierProgress;
  threshold: number;
  isEnded: boolean;
}

export default function TierStatusBadge({ progress, threshold, isEnded }: Props) {
  if (progress.status === "claimed") {
    return <Badge variant="outline" className="border-success/40 text-success">Claimed</Badge>;
  }
  if (progress.status === "winner") {
    return <Badge variant="outline" className="border-primary/60 text-accent-foreground">Winner picked</Badge>;
  }
  if (isEnded) {
    return <Badge variant="outline" className="text-muted-foreground">No winner</Badge>;
  }
  if (progress.status === "voting") {
    return <Badge variant="outline">Voting · {progress.leadingVotes} of {threshold}</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">Awaiting votes</Badge>;
}
