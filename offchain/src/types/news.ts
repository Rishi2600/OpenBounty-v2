// One news item in the landing-page feed.

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;          // opens in a new tab
  source: string;       // e.g. "Solana News"
  publishedAt: Date;
}
