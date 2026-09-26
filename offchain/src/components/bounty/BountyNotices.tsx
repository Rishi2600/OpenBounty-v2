// Banners under the bounty title: "connect your wallet" when logged out, and the
// organizer's refund panel after the deadline.

import { Undo2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  showConnect: boolean;
  refundText: string | null;   // e.g. "1 SOL" when a refund is possible, otherwise null
  onConnect: () => void;
  onRefund: () => void;
}

export default function BountyNotices({ showConnect, refundText, onConnect, onRefund }: Props) {
  return (
    <>
      {showConnect && (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm">Builder, judge or winner? Connect your wallet to enter, vote or claim.</p>
          <Button variant="outline" onClick={onConnect}>
            <Wallet /> Connect wallet
          </Button>
        </Card>
      )}

      {refundText && (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 px-5 py-4 ring-destructive/40">
          <p className="text-sm">The deadline has passed. You can refund the {refundText} nobody claimed.</p>
          <Button variant="destructive" onClick={onRefund}>
            <Undo2 /> Refund {refundText}
          </Button>
        </Card>
      )}
    </>
  );
}
