// Badge with a prize tier's status: Awaiting votes, Voting · 2 of 3, Winner picked, Claimed.

import { Badge } from "@/components/ui/badge";
import type { TierProgress } from "@/utils/status";

interface Props {
  progress: TierProgress;
  threshold: number;
}

export default function TierStatusBadge({ progress, threshold }: Props) {
  if (progress.status === "claimed") {
    return <Badge variant="outline" className="border-success/40 text-success">Claimed</Badge>;
  }
  if (progress.status === "winner") {
    return <Badge variant="outline" className="border-primary/60 text-accent-foreground">Winner picked</Badge>;
  }
  if (progress.status === "voting") {
    return <Badge variant="outline">Voting · {progress.leadingVotes} of {threshold}</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">Awaiting votes</Badge>;
}
