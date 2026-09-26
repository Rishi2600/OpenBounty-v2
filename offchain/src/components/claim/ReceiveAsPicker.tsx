"use client";

// "Receive as" in the claim window: keep the prize token, or pick another token to swap into.

import { ASSET_IDS, AssetId } from "@/constants/assets";
import { cn } from "@/lib/utils";

interface Props {
  prizeAsset: AssetId;
  value: AssetId;
  onChange: (asset: AssetId) => void;
}

export default function ReceiveAsPicker({ prizeAsset, value, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">Receive as</legend>
      <div className="grid grid-cols-3 gap-2">
        {ASSET_IDS.map((id) => (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2 transition-colors hover:bg-accent",
              "has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring"
            )}
          >
            <input type="radio" name="receive-as" value={id} checked={value === id} onChange={() => onChange(id)} className="sr-only" />
            <span className="font-semibold">{id}</span>
            <span className="text-xs text-muted-foreground">{id === prizeAsset ? "Keep" : "Swap"}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
