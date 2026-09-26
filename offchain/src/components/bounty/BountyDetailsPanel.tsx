// Side panel on the bounty detail page: prize pool, deadline, judges, organizer and links.

import { PublicKey } from "@solana/web3.js";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Address from "@/components/common/Address";
import TokenAmount from "@/components/common/TokenAmount";
import type { EscrowAccount } from "@/types/escrow";
import { formatAmount, formatDate, formatDeadline, totalLocked, unclaimedTotal } from "@/utils/format";
import { safeDetailsUrl } from "@/utils/address";
import { ASSETS } from "@/constants/assets";
import { CHAINS, CHAIN_IDS } from "@/constants/chains";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

interface Props {
  escrow: EscrowAccount;
  viewer: PublicKey | null;
}

export default function BountyDetailsPanel({ escrow, viewer }: Props) {
  const detailsUrl = safeDetailsUrl(escrow.metadataUri);
  const asset = ASSETS[escrow.asset];
  const chainNames = CHAIN_IDS.map((id) => CHAINS[id].name);
  const payoutChains = `${chainNames.slice(0, -1).join(", ")} or ${chainNames[chainNames.length - 1]}`;
  const isYou = (key: PublicKey) => viewer !== null && key.equals(viewer);

  return (
    <Card className="gap-5 px-5 py-5">
      <div className="flex flex-col gap-1">
        <span className={LABEL}>Prize pool</span>
        <TokenAmount amount={totalLocked(escrow.tiers)} asset={escrow.asset} className="text-2xl" />
        <span className="text-sm text-muted-foreground">
          {formatAmount(unclaimedTotal(escrow.tiers), escrow.asset)} still locked
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Deadline</span>
        <span>{formatDeadline(escrow.deadline)}</span>
        <span className="text-sm text-muted-foreground">{formatDate(escrow.deadline)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Prize asset</span>
        <span>{asset.name} ({asset.id})</span>
        {asset.crossChain && (
          <span className="text-sm text-muted-foreground">
            Winners can be paid on {payoutChains}.
          </span>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <span className={LABEL}>
          Judges · {escrow.threshold} of {escrow.judges.length} votes to win
        </span>
        {escrow.judges.map((judge) => (
          <Address key={judge.toBase58()} address={judge.toBase58()} isYou={isYou(judge)} />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Organizer</span>
        <Address address={escrow.organizer.toBase58()} isYou={isYou(escrow.organizer)} />
      </div>

      <div className="flex flex-col gap-1">
        <span className={LABEL}>Escrow account</span>
        <Address address={escrow.publicKey.toBase58()} />
      </div>

      {detailsUrl && (
        <a
          href={detailsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          Read the full brief <ExternalLink className="size-4" aria-hidden />
        </a>
      )}
    </Card>
  );
}
