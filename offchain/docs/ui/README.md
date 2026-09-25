# OpenBounty UI

Notes for the UI refactor on `feat/ui-refactor`. Each change updates these docs in the same commit.

**Design rules:** [`.claude/skills/openbounty-ui/SKILL.md`](../../../.claude/skills/openbounty-ui/SKILL.md) covers colors, fonts, pages, components, patterns and code rules. Read it before changing any UI.

**Reference skills** (in `.claude/skills/`, MIT licensed, from [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)):
- `ui-ux-pro-max`: a searchable UX and design database
- `design-system`: how design values are layered
- `ui-styling`: shadcn and Tailwind guides

The copies were trimmed (test folders and a 5.5MB font folder removed), and the script path in `ui-ux-pro-max` was fixed to run from the repo root.

## Styling

- **Setup:** Tailwind v4 and shadcn/ui (Radix, "nova" preset). The shadcn settings are in `components.json`.
- **Colors and fonts:** `app/globals.css`, in three layers:
  1. Base palette (raw values)
  2. Meanings (shadcn names like `--primary`)
  3. `@theme inline`, which turns the meanings into classes like `bg-primary`
- **In components:** use only the classes, never raw hex values.
- **Fonts:** loaded in `app/layout.tsx` and available as `font-sans` (DM Sans), `font-display` (DM Serif Display) and `font-mono` (JetBrains Mono).
- **Dark only:** `<html>` always has the `dark` class.
- **Temporary block:** the "old variable names" block in `globals.css` keeps not-yet-refactored pages working. Delete it at the end of Phase 2.
- **`cn()`:** `src/lib/utils.ts` re-exports it from the `cn` package, shadcn's replacement for clsx + tailwind-merge.

## Running

| Command | Data source |
|---|---|
| `yarn dev` | Real program on devnet |
| `yarn dev:mock` | In-memory sample data. No transactions are sent. |

Both run at http://localhost:3000.

In mock mode a throwaway **Burner Wallet** connects automatically, so no wallet extension is needed:
- **Its key:** a new one is created in memory on every page load. It's never saved or funded.
- **Your role:** the samples are built around the connected address, so you appear as organizer, judge or winner on different bounties.
- **Logged-out screens:** use "Disconnect". The burner reconnects only on the next reload.
- **A real wallet:** you can still pick Phantom or Solflare from the wallet menu.
- **Where it's set up:** `src/components/WalletProvider.tsx`. The burner is never offered outside mock mode.

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
- [x] Install reference skills
- [x] Phase 0: design decisions in `openbounty-ui` (approved)
- [ ] Phase 1: design values, base components, page shell
  - [x] shadcn setup and theme
- [ ] Phase 2: refactor Dashboard, BountyCard, Create form, Header
- [ ] Phase 3: bounty detail page, judge voting, `/me` page (replaces `/claim`), real claim and refund, 404 page
- [ ] Phase 4: loading/empty/error states, mobile layouts, accessibility, clean build
