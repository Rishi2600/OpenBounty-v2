"use client";

// Claim dialog for prizes that can be paid out on several chains (USDC, multichain preview).
// The winner picks where to receive: their Solana wallet, or an address on Base, Ethereum
// or Arbitrum. Other chains show the Circle CCTP steps (burn on Solana, mint on the
// destination). In this preview those steps are simulated.

import { useState } from "react";
import { CircleCheck, Circle, Loader2 } from "lucide-react";
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
import { CHAINS, CHAIN_IDS, ChainId } from "@/constants/chains";
import type { Payout } from "@/types/escrow";
import { isEvmAddress } from "@/utils/address";
import { truncateAddress } from "@/utils/format";
import { mockDelay } from "@/mocks/store";
import { cn } from "@/lib/utils";

type Phase = "choose" | "transferring" | "done";

interface Props {
  open: boolean;
  amountText: string;          // e.g. "4,000 USDC"
  walletAddress: string;       // the winner's Solana wallet
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: (payout: Payout) => Promise<boolean>;   // true when the claim succeeded
}

export default function ClaimDialog({ open, amountText, walletAddress, submitting, onOpenChange, onClaim }: Props) {
  const [chainId, setChainId] = useState<ChainId>("solana");
  const [evmAddress, setEvmAddress] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [phase, setPhase] = useState<Phase>("choose");
  const [stepsDone, setStepsDone] = useState(0);

  const chain = CHAINS[chainId];
  const isOtherChain = chain.addressFormat === "evm";
  const steps = [
    "Prize released from the escrow on Solana",
    "USDC burned on Solana by Circle CCTP",
    "Circle confirms the transfer",
    `${amountText} minted on ${chain.name} to ${truncateAddress(evmAddress.trim(), 6)}`,
  ];

  function handleOpenChange(next: boolean) {
    if (!next) {
      setChainId("solana");
      setEvmAddress("");
      setError(undefined);
      setPhase("choose");
      setStepsDone(0);
    }
    onOpenChange(next);
  }

  async function handleClaim() {
    if (isOtherChain && !isEvmAddress(evmAddress)) {
      setError(`Enter your ${chain.name} address (0x followed by 40 characters).`);
      return;
    }
    const address = isOtherChain ? evmAddress.trim() : walletAddress;
    const ok = await onClaim({ chain: chainId, address });
    if (!ok) return;
    if (!isOtherChain) {
      handleOpenChange(false);
      return;
    }

    // Preview only: walk through the CCTP steps with short pauses
    setPhase("transferring");
    for (let step = 1; step <= steps.length; step++) {
      setStepsDone(step);
      if (step < steps.length) await mockDelay(900);
    }
    setPhase("done");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim {amountText}</DialogTitle>
          <DialogDescription>
            Choose where to receive your prize. On another chain you get native USDC through
            Circle CCTP, not a wrapped token.
          </DialogDescription>
        </DialogHeader>

        {phase === "choose" && (
          <div className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Receive on</legend>
              <div className="grid grid-cols-2 gap-2">
                {CHAIN_IDS.map((id) => (
                  <label
                    key={id}
                    className={cn(
                      "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent",
                      "has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring"
                    )}
                  >
                    <input
                      type="radio"
                      name="payout-chain"
                      value={id}
                      checked={chainId === id}
                      onChange={() => { setChainId(id); setError(undefined); }}
                      className="sr-only"
                    />
                    <span className="font-semibold">{CHAINS[id].name}</span>
                    <span className="text-xs text-muted-foreground">
                      {id === "solana" ? "Your connected wallet" : "Via Circle CCTP"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {isOtherChain && (
              <FormField
                id="payout-address"
                label={`Your ${chain.name} address`}
                helper="The wallet that should receive the USDC. Double-check it: transfers can't be undone."
                error={error}
              >
                <Input
                  id="payout-address"
                  value={evmAddress}
                  onChange={(e) => { setEvmAddress(e.target.value); setError(undefined); }}
                  placeholder="0x..."
                  className="font-mono"
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                  aria-describedby={messageId("payout-address")}
                />
              </FormField>
            )}
          </div>
        )}

        {phase !== "choose" && (
          <ol className="flex flex-col gap-3" aria-live="polite">
            {steps.map((label, index) => {
              const done = index < stepsDone;
              const active = index === stepsDone && phase === "transferring";
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  {done && <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />}
                  {active && <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />}
                  {!done && !active && <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </li>
              );
            })}
            <li className="text-xs text-muted-foreground">Preview: these steps are simulated.</li>
          </ol>
        )}

        <DialogFooter>
          {phase === "choose" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button onClick={handleClaim} disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {submitting ? "Confirming..." : `Claim on ${chain.name}`}
              </Button>
            </>
          )}
          {phase === "transferring" && <Button disabled><Loader2 className="animate-spin" /> Sending...</Button>}
          {phase === "done" && <Button onClick={() => handleOpenChange(false)}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
