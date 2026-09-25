"use client";

// Dialog where a judge votes on one prize: pick a candidate other judges voted for,
// or paste a wallet address. Votes can't be changed, and the dialog says so.

import { FormEvent, useState } from "react";
import { PublicKey } from "@solana/web3.js";
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
import { Input } from "@/components/ui/input";
import FormField, { messageId } from "@/components/common/FormField";
import type { CandidateTally } from "@/utils/status";
import { truncateAddress } from "@/utils/format";
import { parseAddress } from "@/utils/address";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  prizeLabel: string;       // e.g. "1st prize"
  threshold: number;
  tallies: CandidateTally[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (candidate: PublicKey) => void;
}

export default function VoteDialog({
  open,
  prizeLabel,
  threshold,
  tallies,
  submitting,
  onOpenChange,
  onSubmit,
}: Props) {
  const [candidate, setCandidate] = useState("");
  const [error, setError] = useState<string | undefined>();

  function pick(address: string) {
    setCandidate(address);
    setError(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) pick("");
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const key = parseAddress(candidate);
    if (!key) {
      setError("Enter a valid wallet address.");
      return;
    }
    onSubmit(key);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Vote for the {prizeLabel} winner</DialogTitle>
            <DialogDescription>
              A candidate wins once {threshold} {threshold === 1 ? "judge votes" : "judges vote"} for
              them. Votes can&apos;t be changed.
            </DialogDescription>
          </DialogHeader>

          {tallies.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Current candidates</span>
              {tallies.map((tally) => {
                const address = tally.candidate.toBase58();
                const selected = candidate.trim() === address;
                return (
                  <button
                    type="button"
                    key={address}
                    onClick={() => pick(address)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-3 text-left text-sm transition-colors hover:bg-accent",
                      selected && "border-primary bg-accent"
                    )}
                  >
                    <span className="font-mono">{truncateAddress(address)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {tally.votes} {tally.votes === 1 ? "vote" : "votes"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <FormField
            id="candidate"
            label="Winner's wallet address"
            helper="Paste an address, or pick a candidate above."
            error={error}
          >
            <Input
              id="candidate"
              value={candidate}
              onChange={(e) => pick(e.target.value)}
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={messageId("candidate")}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Confirming..." : "Cast vote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
