"use client";

// Confirmation before the organizer refunds, because a refund closes the bounty for good.

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  amountText: string;       // e.g. "3 SOL"
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function RefundDialog({ open, amountText, submitting, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund {amountText}?</DialogTitle>
          <DialogDescription>
            Every unclaimed prize goes back to your wallet and the bounty closes. Winners who
            haven&apos;t claimed yet won&apos;t be able to anymore.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Confirming..." : `Refund ${amountText}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
