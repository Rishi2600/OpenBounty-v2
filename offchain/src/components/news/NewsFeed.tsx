"use client";

// Landing-page section below the bounties: the latest news from around the Solana
// ecosystem. Shows a "Sample" badge while the feed uses sample items.

import { ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
import { useNews } from "@/hooks/useNews";
import { NEWS_IS_SAMPLE, NEWS_MORE_URL } from "@/utils/news";

export default function NewsFeed() {
  const { items, loading, error, refetch } = useNews();

  function renderItems() {
    if (loading) {
      return (
        <div aria-busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      );
    }
    if (error) {
      return <ErrorState message="Couldn't load the latest news." onRetry={refetch} />;
    }
    if (items.length === 0) {
      return <EmptyState icon={Newspaper} title="No news right now" description="Check back soon." />;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
      </div>
    );
  }

  return (
    <section aria-labelledby="news-heading" className="flex flex-col gap-6 border-t pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 id="news-heading" className="font-display text-2xl sm:text-3xl">Around Solana</h2>
            {NEWS_IS_SAMPLE && <Badge variant="outline" className="text-muted-foreground">Sample</Badge>}
          </div>
          <p className="text-muted-foreground">What&apos;s happening across the Solana ecosystem.</p>
        </div>
        <Button asChild variant="outline">
          <a href={NEWS_MORE_URL} target="_blank" rel="noreferrer">
            More news <ExternalLink aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      </div>
      {renderItems()}
    </section>
  );
}
