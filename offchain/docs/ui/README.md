# OpenBounty UI

Notes for the UI refactor on `feat/ui-refactor`. Each change updates these docs in the same commit.

## Running

| Command | Data source |
|---|---|
| `yarn dev` | Real program on devnet |
| `yarn dev:mock` | In-memory sample data. No transactions are sent. |

Both run at http://localhost:3000. You still connect a browser wallet in mock mode, because pages use it to decide your role, but nothing is signed.

## Mock data

Turned on by `NEXT_PUBLIC_MOCK=1`, which `yarn dev:mock` sets. A banner at the top of every page shows when it's on.

- **Samples:** `src/mocks/fixtures.ts`
- **Flag, created bounties, fake tx helpers:** `src/mocks/store.ts`
- **Hooks that switch to mock data:** `useAllEscrows`, `useEscrow`, `useCreateBounty`

The samples are built around the connected wallet ("you"), so every role can be tested with one wallet:

| Bounty | Your role | State |
|---|---|---|
| Build a Solana Wallet Tracker | Organizer | Active, no votes yet |
| Design System for a DeFi Dashboard | Judge (not voted) | Voting in progress: tier 1 at 2 of 3 votes |
| Smart Contract Audit Challenge | Winner of tier 2 | Tier 1 claimed, tier 2 ready to claim |
| Anchor Tutorial Series | Organizer | Expired with an unclaimed tier, so refund is possible |
| Community Meme Contest | None | Ends in about 2 hours |
| Hackathon: Best Mobile dApp | None | Expired; a winner was picked but never claimed |

Other behavior:
- **Created bounties:** they're kept in memory and show up on the dashboard. A page reload clears them.
- **Transactions:** each mock transaction waits about 0.6s so loading states are visible, then returns a signature like `mock-tx-<time>`. Explorer links for these go nowhere.
- **No fully claimed bounty:** once every tier is claimed, the program closes the escrow, so that state never appears on-chain. The dashboard's "Claimed" filter is always empty for that reason.

To add a sample, add another `escrow({...})` entry in `buildMockEscrows`.

## Progress

- [x] Mock data mode
- [ ] Phase 0: read the skill file, record design decisions
- [ ] Phase 1: design values, base components, page shell
- [ ] Phase 2: refactor Dashboard, BountyCard, Create form, Header
- [ ] Phase 3: bounty detail page, judge voting, `/claim` page, real claim and refund
- [ ] Phase 4: loading/empty/error states, mobile layouts, accessibility, clean build
