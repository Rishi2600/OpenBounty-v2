# Multi-asset and multichain prizes (preview)

> **Status: frontend preview in mock mode only.** Nothing here touches a blockchain yet. The deployed OpenBounty program still escrows SOL only, so in normal mode the app behaves exactly as before. This preview shows how the feature would look and work before any program changes are made.

## In one paragraph

Until now, every OpenBounty prize was paid in SOL. With this feature, organizers choose what the prizes are paid in: SOL, a stablecoin (USDC or USDT), or an ecosystem token (BONK or JUP). For USDC prizes, winners also choose **where** to receive their money: their Solana wallet, or an address on Base, Ethereum or Arbitrum. The rest of OpenBounty works the same: the prize pool is locked up front, judges vote, and winners claim.

## What was built

| Where | What changed |
|---|---|
| **Create a bounty** | A new "Prize asset" choice (SOL, USDC, USDT, BONK, JUP). The prize fields and the "Total to lock" line use the chosen token. |
| **Explore** | Every amount shows in its own token ("2,500 USDC", "5,000,000 BONK"). A new filter narrows bounties by prize asset. |
| **Bounty page** | A "Prize asset" section. For USDC it also lists the chains winners can be paid on. Prizes already claimed show where they were paid out (for example "paid out on Base"). |
| **Claiming a USDC prize** | A claim window where the winner picks Solana, Base, Ethereum or Arbitrum. For another chain they enter their `0x…` address, then see each step of the transfer until it's delivered. |
| **Your bounties** | "Ready to claim" adds up prizes per token, like "4 SOL · 2,500 USDC", because tokens can't be added together. |
| **Sample data** | The mock bounties now use a mix of SOL, USDC, USDT and BONK, including a USDC prize you've won, so the whole flow can be tried. |

## How to try it

1. Run `yarn dev:mock` in `offchain/` and open http://localhost:3000. A test wallet connects automatically, and nothing is real.
2. **Explore:** use the asset filter on the right (All assets, SOL, USDC, ...).
3. **Create:** open **Create bounty**, pick **USDC** under "Prize asset", fill in the form and create. Your bounty appears on Explore in USDC.
4. **Claim:** open **Smart Contract Audit Challenge**. You won its 2nd prize (4,000 USDC). Click **Claim 4,000 USDC**, choose **Base**, paste any `0x` address and confirm. Watch the transfer steps, then click **Done**.
5. **Your bounties:** before claiming, it shows the prize under "Ready to claim".

## How people use it

**Organizers**
- Pick the prize asset when creating a bounty. Everything else on the form is the same.
- Fund the prize pool in that token. The full amount is locked when the bounty is created, just like SOL today.
- Refunds after the deadline come back in the same token.

**Judges**
- Nothing changes. Judges vote for winners exactly as before; the asset doesn't affect voting.

**Winners**
- **SOL, USDT, BONK and JUP prizes:** claim with one click; the prize goes to your Solana wallet, as today.
- **USDC prizes:** choose where to receive it. Keep it on Solana, or have it delivered as USDC on Base, Ethereum or Arbitrum, to whichever wallet you already use there.

## How it benefits them

| Who | Benefit |
|---|---|
| **Organizers** | **Budget certainty.** A "5,000 USDC" prize stays worth 5,000 dollars. A SOL prize can be worth more or less by payout day. |
| | **Pay the way your community expects.** Hackathons and teams mostly budget in stablecoins; token communities can reward in their own token (BONK, JUP). |
| | **A wider pool of builders.** Winners don't need to live on Solana to get paid. |
| **Winners** | **Know exactly what you'll receive.** Stablecoin prizes don't change value while judging happens. |
| | **Get paid where you already are.** Receive USDC on Base, Ethereum or Arbitrum without bridging it yourself. |
| | **No wrapped tokens.** Cross-chain USDC arrives as native USDC (issued by Circle), not a bridge IOU. |
| **Judges** | **No new steps.** |
| **OpenBounty** | **Wider reach.** Solana keeps its speed and low fees for the bounty itself, while people on other chains can take part. |

## Supported assets and chains

| Asset | Type | Winner can be paid on |
|---|---|---|
| SOL | Native token | Solana |
| USDC | Stablecoin | Solana, Base, Ethereum, Arbitrum |
| USDT | Stablecoin | Solana |
| BONK | Ecosystem token | Solana |
| JUP | Ecosystem token | Solana |

The list is deliberately short, curated rather than "any token":
- It avoids scam tokens and tokens with unusual decimals.
- It excludes tokens with features that could let an issuer move funds out of an escrow.
- Only USDC is multichain, because Circle's own transfer system (CCTP) moves native USDC between chains without a bridge pool.

## What's real and what's simulated

| Part | In this preview |
|---|---|
| Choosing the asset, amounts, filters, totals | Real UI, working on sample data |
| Locking funds, voting, claiming, refunding | Simulated. The mock runs the same rules as the program. |
| Transfer to Base, Ethereum or Arbitrum | Simulated. The four steps are timed, and no USDC moves. |
| Token balances and prices | Not shown yet |

## What it takes to make this real

For developers. These are the changes needed after the preview:

1. **Program: token vaults.**
   - Hold prizes in a token account owned by the escrow instead of plain SOL, and store the token (mint) on each bounty.
   - Pay out with token transfers, create the winner's token account when needed, and close the vault when the bounty closes.
   - Accept only the allowlisted tokens, and reject Token-2022 tokens with a permanent delegate, transfer fees or transfer hooks.
   - SOL can use the same path as wrapped SOL (wSOL).
2. **Program: cross-chain payout for USDC.**
   - When claiming with a destination chain, the program burns the prize through Circle CCTP instead of transferring it.
   - The USDC is then minted on the destination chain, either by the winner in a second step or by a relayer service.
3. **Redeploy the program.** This needs keys used only for this project (see the project notes on key isolation). Then regenerate the IDL and types for the frontend.
4. **Frontend: switch the preview on for real.**
   - `MULTI_ASSET_PREVIEW` in `src/constants/assets.ts` becomes true outside mock mode.
   - `useCreateBounty` and `useBountyActions` send the new instructions.
   - `ClaimDialog` reports real CCTP progress instead of the simulated steps.
   - Show the user's token balances and "≈ $" values (the Jupiter price API works from the browser).

## Where the code is

| File | Purpose |
|---|---|
| `src/constants/assets.ts` | Asset allowlist (decimals, mainnet mints, which ones are multichain) and the `MULTI_ASSET_PREVIEW` switch |
| `src/constants/chains.ts` | Payout chains and their CCTP domain numbers |
| `src/utils/format.ts` | `formatAmount`, `formatTotals`, `toBaseUnits`: amounts in each token's own decimals |
| `src/components/create/AssetPicker.tsx` | "Prize asset" choice on the create form |
| `src/components/bounty/ClaimDialog.tsx` | Payout-chain choice and transfer steps |
| `src/components/common/TokenAmount.tsx` | Shows any amount in its token |
| `src/mocks/fixtures.ts`, `src/mocks/actions.ts` | Mixed-asset samples, and a mock claim that records where the prize was paid out |
