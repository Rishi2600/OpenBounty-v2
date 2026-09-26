"use client";

// "Prize asset" choice on the create form (multi-asset preview, mock mode only).
// Native radio buttons styled as cards, so arrow keys and screen readers work as usual.

import { ASSETS, ASSET_IDS, AssetId } from "@/constants/assets";
import { cn } from "@/lib/utils";

const KIND_LABELS = {
  native: "Native token",
  stablecoin: "Stablecoin",
  ecosystem: "Ecosystem token",
};

interface Props {
  value: AssetId;
  onChange: (asset: AssetId) => void;
}

export default function AssetPicker({ value, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Prize asset</legend>
      <p className="text-sm text-muted-foreground">
        What winners are paid in. Stablecoins keep the prize value fixed; USDC can also be paid
        out on other chains.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ASSET_IDS.map((id) => {
          const asset = ASSETS[id];
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent",
                "has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring"
              )}
            >
              <input
                type="radio"
                name="prize-asset"
                value={id}
                checked={value === id}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <span className="font-semibold">{asset.id}</span>
              <span className="text-xs text-muted-foreground">
                {KIND_LABELS[asset.kind]}
                {asset.crossChain && " · multichain payout"}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
