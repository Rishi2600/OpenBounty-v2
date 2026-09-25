// Where the landing-page news comes from. Right now: sample items.
//
// Planned real source ("option A", no backend needed):
// Solana's official feed, https://solana.com/news/rss.xml, allows browser requests.
// Fetch it, parse it with DOMParser, map each <item> (title, link, description,
// pubDate) to a NewsItem, then set NEWS_IS_SAMPLE to false.

import type { NewsItem } from "@/types/news";
import { buildSampleNews } from "@/mocks/news";
import { mockDelay } from "@/mocks/store";

export const NEWS_IS_SAMPLE = true;

// "More news" link under the feed
export const NEWS_MORE_URL = "https://solana.com/news";

export async function getNews(): Promise<NewsItem[]> {
  await mockDelay(500); // behave like a network request so loading states show
  return buildSampleNews();
}
