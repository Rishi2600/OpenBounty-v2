# Claim in any token, and the Markets page (preview)

> **Status: frontend preview.** Prices and swap quotes are **real and live**: CoinGecko and Jupiter, called from the browser with no keys. The swap itself is **simulated in mock mode** (`yarn dev:mock`): nothing is sent, and the claimed prize is recorded as "received as ...". Outside mock mode the claim works as before (straight to your Solana wallet). The Markets page works in every mode.

## In one paragraph

Winners no longer have to take their prize in whatever token the organizer chose. When claiming, they pick **what to receive it in** (SOL, USDC, USDT, BONK or JUP). They see a live quote first: about how much they'll get, the minimum guaranteed, and how much the trade moves the price. A new **Markets** page shows live prices and charts for those tokens (plus Bitcoin and Ethereum for reference), and a **"What's my prize worth?"** converter. So winners can look first, then claim.

## What was built

| Where | What changed |
|---|---|
| **Claim window** | Every claim opens it. **Receive as**: keep the prize token or swap it into another. |
| **Live quote** | Shown when swapping, refreshed every 10 seconds:<br>• **You'll receive about**, with a dollar estimate<br>• **Minimum received**<br>• **Price impact**, in red with a warning above 1%<br>• the token's 24h trend and a **See full chart** link |
| **Receive on** | When receiving USDC you can still choose Solana, Base, Ethereum or Arbitrum (from the multichain feature) |
| **After claiming** | Claims that swap or change chain show each step, then **Done**. The prize card shows "received as 33 SOL". |
| **Markets page** (new, top menu) | Live price, 24h change and 7-day trend for every claimable token, plus BTC and ETH for reference. It shows when prices were last updated and credits the price source. |
| **Big chart** | Click a token to see its chart with **1H / 24H / 7D / 30D** ranges:<br>• hover, or use the arrow keys, to read any point<br>• start, high, low, now and change are listed underneath |
| **Prize converter** | **What's my prize worth?**: enter an amount and token, and see its dollar value and the equivalent in every other token. It's pre-filled with your prize waiting to be claimed. |

## User guide

Step-by-step, from the user's point of view. When you claim for real, your wallet asks you to approve first. In the preview (mock mode) nothing is sent, so there's no approval step.

### For winners: check prices before claiming

1. Open **Markets** in the top menu.
2. Look at the cards under **Tokens you can claim prizes in**. Each shows the price, the change over the last 24 hours (an arrow with + or −), and a 7-day trend line. **Updated ... ago** tells you how fresh the prices are.
3. Click a token to open its chart below. Choose **1H**, **24H**, **7D** or **30D** above the chart. Hover the chart, or click it and use the arrow keys, to read the price at any time. The list under the chart shows the start, high, low, current price and change.
4. Use **What's my prize worth?** on the right. If you have a prize waiting, it's filled in for you ("Filled in with your prize from ..."). Otherwise type an amount and pick a token. It shows the dollar value and the equivalent in every other token.

These are market prices, for information. The exact amount you'd get is the quote in the claim window, which includes fees and price impact.

### For winners: claim in the token you want

1. Open **Your bounties**, then **Ready to claim**, and click **Claim**. Or open the bounty and click **Claim** on your prize.
2. Under **Receive as**, choose a token. The prize's own token is marked **Keep**; the others are marked **Swap**.
3. If you chose another token, read the live quote:
   - **You'll receive about**: the expected amount, with its dollar value.
   - **Minimum received**: the least you'll get. If the price moves below this before the swap completes, it doesn't go through and you can try again.
   - **Price impact**: how much your prize moves the price. It's usually tiny; above 1% it turns red with a warning.
   - The token's 24h trend. **See full chart** opens Markets in a new tab.
4. The quote refreshes every 10 seconds. The claim button is available once a quote has loaded.
5. Click the button. It says exactly what will happen, like **Claim as SOL**. Approve in your wallet.
6. The window shows each step (prize released, swapped with Jupiter), then **Done**. Your prize card shows **received as ...**.

### For winners: receive USDC on another chain

1. In the claim window, choose **USDC** under **Receive as** (or keep it, if the prize is already USDC).
2. Under **Receive on**, choose **Base**, **Ethereum** or **Arbitrum**, and paste your address there (it starts with `0x`).
3. Click **Claim on Base** (or the chain you picked), approve, and follow the steps until **Done**.

### For everyone

- The **Markets** page is open to anyone, even without a wallet. The converter is pre-filled only when your connected wallet has a prize to claim.

### Common questions

- **Why is the quote different from the chart price?** The chart shows the market price. A swap also pays small fees, and a large prize in a less-traded token moves the price (the **Price impact** line), so the quote is the number to trust.
- **What if the price moves while I'm claiming?** You never get less than **Minimum received**. If the price moves further than that, the swap fails and you can claim again with a fresh quote.
- **Can I receive BONK, JUP or SOL on another chain?** Not yet. Only USDC can go to other chains (through Circle CCTP), so **Receive on** appears only for USDC.
- **Why is the claim button greyed out?** It's waiting for a live quote. If the quote can't load, a message says so; try again in a moment.
- **Why can't I claim in BTC or ETH?** They're on the Markets page for reference only.
- **How fresh are the prices?** They refresh every minute; **Updated ... ago** shows when. Swap quotes refresh every 10 seconds.
- **Where do the prices come from?** CoinGecko for market prices and charts, and Jupiter for swap quotes.

## Try it in the preview

For the team.

1. Run `yarn dev:mock` in `offchain/` and open http://localhost:3000. A test wallet connects automatically. Prices and quotes are real; the swap is simulated.
2. Open **Markets**. Click **BONK** and try each chart range. The converter is pre-filled with the test wallet's 4,000 USDC prize.
3. Open **Smart Contract Audit Challenge**, then **Claim 4,000 USDC**.
   - Choose **BONK**, then **SOL**, under **Receive as** and watch the live quote change.
   - Click **Claim as SOL**, watch the steps, and click **Done**. The bounty closes with "You claimed 4,000 USDC as ... SOL".
4. Reload and try **USDC → Base** under **Receive on** to see the cross-chain steps.

## How it benefits them

| Who | Benefit |
|---|---|
| **Winners** | **Paid in what they actually want**, without a separate swap in another app. |
| | **Know before claiming:** a live quote with a guaranteed minimum and the price impact, plus charts and a converter for context. |
| | **Protected from bad fills:** if the price moves too far during the swap, it doesn't happen. |
| **Organizers** | **Pick a prize token without worrying winners won't want it.** A community can pay in its own token (BONK, JUP) while winners still leave with USDC or SOL. |
| **Everyone** | **A useful, open Markets page** for the tokens used on OpenBounty, which keeps people in the app. |

## Where the data comes from

- **Market prices and charts:** [CoinGecko](https://www.coingecko.com)'s free public API.
  - **One request** returns every token's price, 24h change and 7 days of hourly prices, so the cards and the **24H** and **7D** charts cost no extra requests. **1H** and **30D** fetch their own history.
  - Everything is cached: 1 minute for prices, 5 minutes for history.
  - **Rate limit:** the free API is rate-limited, and a rate-limited reply looks like a network error in the browser. The page then says "try again in a minute", with **Try again**. A production app should use a CoinGecko API key (a free Demo key is enough for small traffic), or a paid plan.
  - **Credit:** CoinGecko's free API asks for a credit, shown as "Price data from CoinGecko".
- **Swap quotes:** [Jupiter](https://jup.ag)'s public quote API, refreshed every 10 seconds while the claim window is open.
- **No backend and no API keys:** everything runs in the browser.

## What's real and what's simulated

| Part | In this preview |
|---|---|
| Markets prices, charts and converter | Real, live |
| Swap quotes in the claim window | Real, live (Jupiter, using mainnet token addresses) |
| The swap itself | Simulated: nothing is sent, and the prize is recorded as received in the chosen token |
| Cross-chain delivery (USDC to Base, Ethereum, Arbitrum) | Simulated (see [../multichain/README.md](../multichain/README.md)) |

## What it takes to make this real

For developers.

1. **No program change is needed for the swap.** Claim sends the prize to the winner's wallet as today; the frontend then asks Jupiter's Swap API for a swap transaction for the received amount and sends it.
   - That's two approvals. A later improvement could bundle both in one transaction.
2. **Frontend.**
   - In `ClaimDialog`, after `claim()` succeeds, fetch and send the Jupiter swap transaction for `swap.quote`, and report real progress instead of `mockDelay`.
   - Handle a failed swap: the prize is already in the wallet in its original token, so say so and offer to retry the swap.
   - Show the swap in the steps from the real transaction status.
3. **Prices in production.** Add a CoinGecko API key (or switch to Pyth or another provider). Keep the caching.
4. **Multi-asset prizes on-chain.** They need the program changes described in [../multichain/README.md](../multichain/README.md); until then, real prizes are SOL, and swapping SOL to USDC is the main use.

## Where the code is

| File | Purpose |
|---|---|
| `src/constants/markets.ts`, `src/types/market.ts` | Markets token list (claimable, plus BTC and ETH), refresh rates, slippage, price source |
| `src/utils/marketData.ts` | CoinGecko: one-request quotes, sparkline-based 24H and 7D charts, 1H and 30D history, caching, friendly errors |
| `src/utils/swap.ts` | Jupiter quote: amount out, minimum received, price impact |
| `src/hooks/useMarketQuotes.ts`, `usePriceHistory.ts`, `useSwapQuote.ts`, `useNow.ts` | Live data hooks that never flash on refresh |
| `src/utils/chart.ts`, `src/hooks/useElementWidth.ts` | Chart scales, ticks, paths and sizing |
| `src/components/markets/` | Markets page: cards, chart panel, SVG price chart, sparkline, summary, converter, freshness label |
| `src/components/claim/` | Claim window parts: Receive as, Receive on, live quote box, transfer steps |
| `src/components/bounty/ClaimDialog.tsx` | The claim window that puts them together |
| `app/markets/page.tsx` | The `/markets` route |
