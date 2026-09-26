"use client";

// Claim window (multi-asset preview). The winner chooses:
// - Receive as: keep the prize token, or swap it into another one (live Jupiter quote)
// - Receive on: when receiving USDC, their Solana wallet or Base / Ethereum / Arbitrum (CCTP)
// Claims that swap or move chains then show each step. In the preview they're simulated.

import { useState } from "react";
import { BN } from "@coral-xyz/anchor";
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
import ReceiveAsPicker from "@/components/claim/ReceiveAsPicker";
import ReceiveOnPicker from "@/components/claim/ReceiveOnPicker";
import SwapQuoteBox from "@/components/claim/SwapQuoteBox";
import TransferSteps from "@/components/claim/TransferSteps";
import { ASSETS, AssetId } from "@/constants/assets";
import { CHAINS, ChainId } from "@/constants/chains";
import type { Payout } from "@/types/escrow";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { isEvmAddress } from "@/utils/address";
import { formatAmount, truncateAddress } from "@/utils/format";
import { mockDelay } from "@/mocks/store";

type Phase = "choose" | "transferring" | "done";

interface Props {
  open: boolean;
  prizeAsset: AssetId;
  prizeAmount: BN;
  walletAddress: string;       // the winner's Solana wallet
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: (payout: Payout) => Promise<boolean>;   // true when the claim succeeded
}

export default function ClaimDialog(props: Props) {
  const { open, prizeAsset, prizeAmount, walletAddress, submitting, onOpenChange, onClaim } = props;
  const [receiveAs, setReceiveAs] = useState<AssetId | null>(null);   // null = keep the prize token
  const [chainId, setChainId] = useState<ChainId>("solana");
  const [evmAddress, setEvmAddress] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [phase, setPhase] = useState<Phase>("choose");
  const [stepsDone, setStepsDone] = useState(0);

  const target = receiveAs ?? prizeAsset;
  const swapping = target !== prizeAsset;
  const swap = useSwapQuote(prizeAsset, target, open && swapping ? prizeAmount : null);

  const offerChains = ASSETS[target].crossChain;
  const chain = CHAINS[chainId];
  const toOtherChain = offerChains && chain.addressFormat === "evm";

  let receivedText = formatAmount(prizeAmount, prizeAsset);
  if (swapping) receivedText = swap.quote ? formatAmount(new BN(swap.quote.outAmount), target) : `your ${target}`;

  const steps = ["Prize released from the escrow on Solana"];
  if (swapping) steps.push(`Swapped to ${receivedText} with Jupiter`);
  if (toOtherChain) {
    steps.push("USDC burned on Solana by Circle CCTP");
    steps.push("Circle confirms the transfer");
    steps.push(`${receivedText} minted on ${chain.name} to ${truncateAddress(evmAddress.trim(), 6)}`);
  }

  let claimLabel = "Claim";
  if (swapping) claimLabel += ` as ${target}`;
  if (toOtherChain) claimLabel += ` on ${chain.name}`;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReceiveAs(null);
      setChainId("solana");
      setEvmAddress("");
      setError(undefined);
      setPhase("choose");
      setStepsDone(0);
    }
    onOpenChange(next);
  }

  async function handleClaim() {
    if (toOtherChain && !isEvmAddress(evmAddress)) {
      setError(`Enter your ${chain.name} address (0x followed by 40 characters).`);
      return;
    }
    const payout: Payout = {
      chain: toOtherChain ? chainId : "solana",
      address: toOtherChain ? evmAddress.trim() : walletAddress,
    };
    if (swapping && swap.quote) {
      payout.asset = target;
      payout.amount = swap.quote.outAmount;
    }

    const ok = await onClaim(payout);
    if (!ok) return;
    if (steps.length === 1) {
      handleOpenChange(false);
      return;
    }

    // Preview only: walk through the steps with short pauses
    setPhase("transferring");
    for (let step = 1; step <= steps.length; step++) {
      setStepsDone(step);
      if (step < steps.length) await mockDelay(900);
    }
    setPhase("done");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim {formatAmount(prizeAmount, prizeAsset)}</DialogTitle>
          <DialogDescription>
            Choose what to receive your prize in, and where. Swaps use Jupiter; USDC on another
            chain arrives as native USDC through Circle CCTP.
          </DialogDescription>
        </DialogHeader>

        {phase === "choose" && (
          <div className="flex flex-col gap-5">
            <ReceiveAsPicker prizeAsset={prizeAsset} value={target} onChange={(asset) => { setReceiveAs(asset); setError(undefined); }} />
            {swapping && <SwapQuoteBox to={target} quote={swap.quote} loading={swap.loading} error={swap.error} />}
            {offerChains && <ReceiveOnPicker value={chainId} onChange={(id) => { setChainId(id); setError(undefined); }} />}
            {toOtherChain && (
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

        {phase !== "choose" && <TransferSteps steps={steps} done={stepsDone} running={phase === "transferring"} />}

        <DialogFooter>
          {phase === "choose" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button onClick={handleClaim} disabled={submitting || (swapping && !swap.quote)}>
                {submitting && <Loader2 className="animate-spin" />}
                {submitting ? "Confirming..." : claimLabel}
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
