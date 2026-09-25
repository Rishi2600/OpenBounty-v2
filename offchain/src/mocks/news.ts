// Sample news for the landing-page feed until a real source is connected.
// Headlines are deliberately generic (no claims about real projects), and the
// feed shows a "Sample" badge while these are in use.

import type { NewsItem } from "@/types/news";

const HOUR = 60 * 60 * 1000;

const SAMPLES = [
  {
    hoursAgo: 2,
    title: "Developer tooling update makes local testing faster",
    summary: "New testing workflows cut the time from code change to passing test for on-chain programs.",
  },
  {
    hoursAgo: 7,
    title: "How hackathon teams are structuring prize pools",
    summary: "Tiered prizes, judge panels and clear deadlines are becoming the norm for community bounties.",
  },
  {
    hoursAgo: 26,
    title: "Network upgrade notes: what changes for app developers",
    summary: "A plain-language walkthrough of the latest upgrade and the few things apps need to update.",
  },
  {
    hoursAgo: 50,
    title: "Wallet design trends: fewer pop-ups, clearer signing",
    summary: "Wallets are moving toward readable transaction previews so users know exactly what they sign.",
  },
  {
    hoursAgo: 98,
    title: "A beginner's guide to on-chain escrow",
    summary: "How program-owned accounts hold funds safely until the agreed conditions are met.",
  },
  {
    hoursAgo: 170,
    title: "Grant programs worth watching this quarter",
    summary: "An overview of ecosystem grants for builders, from small experiments to full products.",
  },
];

export function buildSampleNews(): NewsItem[] {
  const now = Date.now();
  return SAMPLES.map((sample, index) => ({
    id: `sample-${index}`,
    title: sample.title,
    summary: sample.summary,
    url: "https://solana.com/news",
    source: "Sample",
    publishedAt: new Date(now - sample.hoursAgo * HOUR),
  }));
}
