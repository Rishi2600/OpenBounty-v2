"use client";

// Explore: every bounty on-chain, newest deadlines first, filterable by status.
// Works without a wallet; connecting one adds "You organize / judge / won" tags.

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Plus, SearchX, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import BountyCard from "@/components/bounty/BountyCard";
import BountyCardSkeleton from "@/components/bounty/BountyCardSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import FilterButtons from "@/components/common/FilterButtons";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useProgram } from "@/hooks/useProgram";
import type { EscrowAccount } from "@/types/escrow";
import { BountyStatus, getBountyStatus } from "@/utils/status";
import { ASSET_IDS, AssetId, MULTI_ASSET_PREVIEW } from "@/constants/assets";

type Filter = "all" | BountyStatus;

const FILTER_LABELS: Record<Filter, string> = {
  "all": "All",
  "open": "Open",
  "ending-soon": "Ending soon",
  "ended": "Ended",
};

const FILTERS: Filter[] = ["all", "open", "ending-soon", "ended"];

// Running bounties first (closest deadline first), then ended ones (most recent first)
function sortForExplore(escrows: EscrowAccount[]): EscrowAccount[] {
  const now = Date.now() / 1000;
  const running = escrows
    .filter((e) => e.deadline.toNumber() > now)
    .sort((a, b) => a.deadline.toNumber() - b.deadline.toNumber());
  const ended = escrows
    .filter((e) => e.deadline.toNumber() <= now)
    .sort((a, b) => b.deadline.toNumber() - a.deadline.toNumber());
  return [...running, ...ended];
}

function countByFilter(escrows: EscrowAccount[], filter: Filter): number {
  if (filter === "all") return escrows.length;
  return escrows.filter((e) => getBountyStatus(e.deadline) === filter).length;
}

export default function ExploreBounties() {
  const { publicKey } = useWallet();
  const program = useProgram();
  const { escrows, loading, error, refetch } = useAllEscrows(program);
  const [filter, setFilter] = useState<Filter>("all");
  const [assetFilter, setAssetFilter] = useState<"all" | AssetId>("all");

  const sorted = sortForExplore(escrows);
  const byStatus = filter === "all"
    ? sorted
    : sorted.filter((e) => getBountyStatus(e.deadline) === filter);
  const visible = assetFilter === "all"
    ? byStatus
    : byStatus.filter((e) => e.asset === assetFilter);

  // Asset filter only exists in the multi-asset preview (mock mode)
  const assetOptions = [
    { value: "all", label: "All assets", count: loading ? undefined : escrows.length },
    ...ASSET_IDS.map((id) => ({
      value: id,
      label: id,
      count: loading ? undefined : escrows.filter((e) => e.asset === id).length,
    })),
  ];

  function showAll() {
    setFilter("all");
    setAssetFilter("all");
  }

  const filterOptions = FILTERS.map((value) => ({
    value,
    label: FILTER_LABELS[value],
    count: loading ? undefined : countByFilter(escrows, value),
  }));

  const createButton = (
    <Button asChild>
      <Link href="/create"><Plus /> Create bounty</Link>
    </Button>
  );

  function renderList() {
    if (loading) {
      return (
        <div aria-busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <BountyCardSkeleton key={i} />)}
        </div>
      );
    }
    if (error) {
      return <ErrorState message="Couldn't load bounties from devnet." onRetry={refetch} />;
    }
    if (escrows.length === 0) {
      return (
        <EmptyState
          icon={Trophy}
          title="No bounties yet"
          description="Be the first to lock a prize pool on-chain."
          action={createButton}
        />
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No bounties match these filters"
          description="Try another filter."
          action={<Button variant="outline" onClick={showAll}>Show all</Button>}
        />
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((escrow) => (
          <BountyCard key={escrow.publicKey.toBase58()} escrow={escrow} viewer={publicKey} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Explore bounties"
        description="Prize pools locked on Solana. Judges vote on winners, winners claim directly."
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterButtons
          label="Filter by status"
          options={filterOptions}
          value={filter}
          onChange={(value) => setFilter(value as Filter)}
        />
        {MULTI_ASSET_PREVIEW && (
          <FilterButtons
            label="Filter by prize asset"
            options={assetOptions}
            value={assetFilter}
            onChange={(value) => setAssetFilter(value as "all" | AssetId)}
          />
        )}
      </div>
      {renderList()}
    </div>
  );
}
