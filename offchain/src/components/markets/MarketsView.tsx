"use client";

// The Markets page: live prices for the tokens prizes can be claimed in (plus BTC and
// ETH for reference), a big chart for the selected token, and the prize converter.

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/layout/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import MarketCard from "./MarketCard";
import MarketChartPanel from "./MarketChartPanel";
import PrizeConverter, { ConverterPrefill } from "./PrizeConverter";
import UpdatedAgo from "./UpdatedAgo";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { useAllEscrows } from "@/hooks/useAllEscrows";
import { useProgram } from "@/hooks/useProgram";
import { MARKET_ASSETS, MarketAsset, MarketId, PRICE_SOURCE } from "@/constants/markets";
import { getViewerTasks } from "@/utils/tasks";
import { toAmountText } from "@/utils/format";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export default function MarketsView() {
  const { publicKey } = useWallet();
  const program = useProgram();
  const market = useMarketQuotes();
  // Bounties are only needed to pre-fill the converter, so only load them with a wallet
  const { escrows } = useAllEscrows(program, publicKey !== null);
  const [selected, setSelected] = useState<MarketId>("SOL");

  // First prize waiting to be claimed, if any
  let prefill: ConverterPrefill | null = null;
  if (publicKey) {
    const task = getViewerTasks(escrows, publicKey).toClaim[0];
    if (task) {
      prefill = {
        amount: toAmountText(task.escrow.tiers[task.tierIndex].amount, task.escrow.asset),
        asset: task.escrow.asset,
        source: task.escrow.title,
      };
    }
  }

  const claimable = MARKET_ASSETS.filter((asset) => asset.claimable);
  const reference = MARKET_ASSETS.filter((asset) => !asset.claimable);
  const selectedAsset = MARKET_ASSETS.find((asset) => asset.id === selected) ?? MARKET_ASSETS[0];

  function renderCards(assets: MarketAsset[]) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {assets.map((asset) => {
          const quote = market.quotes.find((q) => q.id === asset.id);
          if (!quote) return null;
          return (
            <MarketCard key={asset.id} asset={asset} quote={quote} selected={asset.id === selected} onSelect={() => setSelected(asset.id)} />
          );
        })}
      </div>
    );
  }

  function renderContent() {
    if (market.loading) {
      return (
        <div aria-busy className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      );
    }
    if (market.error && market.quotes.length === 0) {
      return <ErrorState message={market.error} onRetry={market.refetch} />;
    }
    return (
      <>
        <section aria-labelledby="claimable-heading" className="flex flex-col gap-3">
          <h2 id="claimable-heading" className={LABEL}>Tokens you can claim prizes in</h2>
          {renderCards(claimable)}
        </section>
        <section aria-labelledby="reference-heading" className="flex flex-col gap-3">
          <h2 id="reference-heading" className={LABEL}>For reference</h2>
          {renderCards(reference)}
        </section>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <MarketChartPanel asset={selectedAsset} quote={market.quotes.find((q) => q.id === selected)} />
          <PrizeConverter key={prefill ? prefill.source : "none"} quotes={market.quotes} prefill={prefill} />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Markets"
        description="Live prices for the tokens you can claim prizes in, plus Bitcoin and Ethereum for reference."
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <UpdatedAgo date={market.updatedAt} />
          <span>
            Price data from{" "}
            <a href={PRICE_SOURCE.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
              {PRICE_SOURCE.name}
            </a>
          </span>
          {market.error && market.quotes.length > 0 && (
            <span className="text-destructive">Couldn&apos;t refresh. Showing the last prices.</span>
          )}
        </div>
        <Alert>
          <Info aria-hidden />
          <AlertDescription>
            Prices are for information. When you claim a prize in another token, the claim window
            shows the exact amount you&apos;ll receive.
          </AlertDescription>
        </Alert>
      </div>

      {renderContent()}
    </div>
  );
}
