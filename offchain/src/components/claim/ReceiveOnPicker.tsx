"use client";

// "Receive on" in the claim window: your Solana wallet, or another chain via Circle CCTP
// (only offered when the prize is received as USDC).

import { CHAINS, CHAIN_IDS, ChainId } from "@/constants/chains";
import { cn } from "@/lib/utils";

interface Props {
  value: ChainId;
  onChange: (chain: ChainId) => void;
}

export default function ReceiveOnPicker({ value, onChange }: Props) {
  return (
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
            <input type="radio" name="payout-chain" value={id} checked={value === id} onChange={() => onChange(id)} className="sr-only" />
            <span className="font-semibold">{CHAINS[id].name}</span>
            <span className="text-xs text-muted-foreground">
              {id === "solana" ? "Your connected wallet" : "Via Circle CCTP"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
