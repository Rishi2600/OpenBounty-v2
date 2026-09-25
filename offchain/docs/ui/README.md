# OpenBounty UI

Notes for the UI refactor on `feat/ui-refactor`. Each change updates these docs in the same commit.

**Design rules:** [`.claude/skills/openbounty-ui/SKILL.md`](../../../.claude/skills/openbounty-ui/SKILL.md) covers colors, fonts, pages, components, patterns and code rules. Read it before changing any UI.

**Reference skills:** these come from [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT licensed):
- `ui-ux-pro-max`: a searchable UX and design database
- `design-system`: how design values are layered
- `ui-styling`: shadcn and Tailwind guides

They're third-party tools (Python scripts and data files), so they're **installed locally and not committed**. `.gitignore` lists them. To install them, run from the repo root:

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/ui-ux-pro-max-skill
cp -r /tmp/ui-ux-pro-max-skill/.claude/skills/{ui-ux-pro-max,design-system,ui-styling} .claude/skills/
# The search script assumes a plugin install; point it at the repo instead
sed -i 's|${CLAUDE_PLUGIN_ROOT}/.claude/skills/|.claude/skills/|g' .claude/skills/ui-ux-pro-max/SKILL.md
```

This refactor was done with upstream commit `dcc40ff`. The project's own skill (`openbounty-ui`) is committed and doesn't need them to be read. They only add searchable guidance on top.

## Styling

- **Setup:** Tailwind v4 and shadcn/ui (Radix, "nova" preset). The shadcn settings are in `components.json`.
- **Colors and fonts:** `app/globals.css`, in three layers:
  1. Base palette (raw values)
  2. Meanings (shadcn names like `--primary`)
  3. `@theme inline`, which turns the meanings into classes like `bg-primary`
- **In components:** use only the classes, never raw hex values.
- **Fonts:** loaded in `app/layout.tsx` and available as `font-sans` (DM Sans), `font-display` (DM Serif Display) and `font-mono` (JetBrains Mono).
- **Dark only:** `<html>` always has the `dark` class.
- **Native controls:** `color-scheme: dark` on `<html>` makes the date picker and scrollbars dark too.
- **Accessibility, set globally in `globals.css` and `layout.tsx`:**
  - a "Skip to content" link is the first Tab stop
  - links get a solid 2px ochre focus outline
  - the system "reduce motion" setting turns off animations
- **Wallet picker:** the popup from `@solana/wallet-adapter-react-ui` is restyled at the bottom of `globals.css` with our colors and fonts.
- **Page titles:** each `app/**/page.tsx` exports `metadata.title`, and the layout's template turns it into "Title · OpenBounty".
- **Pages are server components:** they render one client component, like `ExploreBounties`, `MyBounties` or `BountyDetail`. That keeps `"use client"` at the leaves, and lets the bounty page return a real 404 for an address that can't be valid.
- **`cn()`:** `src/lib/utils.ts` re-exports it from the `cn` package, shadcn's replacement for clsx + tailwind-merge.

### Changes to generated shadcn files

Files in `src/components/ui/` come from `npx shadcn add`. Our edits to them, each marked with an `OpenBounty tweak` comment:

| File | Change | Why |
|---|---|---|
| `button.tsx` | Default and icon sizes are 44px on phones (`h-11`) and compact from `sm` up (`h-9`). `lg` is always 44px. | Touch targets |
| `button.tsx` | `destructive` is a solid red fill with dark text | The tinted version was 3.2–4.4:1 contrast, and the minimum is 4.5:1 |
| `badge.tsx` | `destructive` has no fill: red text and a red border | Same contrast problem |
| `input.tsx` | 44px tall on phones, `h-9` from `sm` up | Touch targets |
| `sonner.tsx` | Theme fixed to dark; `next-themes` removed | The app is dark-only |

If you re-run `shadcn add --overwrite` on these files, apply the tweaks again.

Available now: `alert`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `separator`, `sheet`, `skeleton`, `sonner`, `tabs`, `textarea`, `tooltip`. `TooltipProvider` and `Toaster` are already mounted in `app/layout.tsx`.

## Code map

| Path | What's there |
|---|---|
| `src/types/escrow.ts` | `EscrowAccount`, `PrizeTier`, `TierVote`, the escrow shape every component uses |
| `src/utils/format.ts` | `formatSol`, `formatDeadline`, `formatDate`, `placeLabel` ("1st prize"), `truncateAddress`, `totalLocked`, `unclaimedTotal` |
| `src/utils/status.ts` | `getBountyStatus` (open / ending-soon / ended), `getTierProgress` (awaiting / voting / winner / claimed), `getCandidateTallies` (votes per candidate), `countDecidedTiers` |
| `src/utils/roles.ts` | `getViewerRoles(escrow, wallet)`: is the wallet the organizer, a judge, or a winner (and of which tiers) |
| `src/constants/program.ts` | Program ID, explorer URLs, and the program's limits (`MAX_JUDGES`, `MAX_TIERS`, `MAX_TITLE_BYTES`, `MAX_METADATA_URI_BYTES`) |
| `src/utils/address.ts` | `parseAddress(text)`: a `PublicKey`, or `null` if the text isn't a valid address. `safeDetailsUrl(uri)`: only `http(s)` and `ipfs://` links (turned into a gateway URL); anything else, such as `javascript:`, is dropped. |
| `src/utils/tasks.ts` | `getViewerTasks(escrows, wallet)`: prizes to vote on, prizes to claim, bounties to refund, plus the bounties you organize and judge |
| `src/utils/txErrors.ts` | `friendlyTxError(err)`: program errors (`Error Code: X`) and wallet errors as short plain-English text for toasts. Add new program errors here. |
| `src/utils/anchor-setup.ts` | `getProgram` (signs with the wallet), `getReadOnlyProgram` (logged-out reads), `toEscrowAccount` (decoded account -> `EscrowAccount`), `findNextNonce` |
| `src/utils/txToast.ts` | `toastTxSuccess(message, signature)` (with a "View" explorer action, or a "Mock transaction" note) and `toastTxError(err)` |
| `src/hooks/useBountyActions.ts` | `vote(tier, candidate)`, `claim(tier)`, `refund()` for one bounty, plus `pending` (`"vote-0"`, `"claim-1"`, `"refund"`). Uses the mock actions in mock mode. |
| `src/hooks/` | Data hooks: `useAllEscrows` (every bounty), `useEscrow(address)` (one bounty; `null` if missing or closed), `useCreateBounty`, `useBalance`, `useProgram`. The read hooks work without a wallet. |
| `src/mocks/` | Mock mode data (see below) |

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
- **Flag, in-memory state, fake tx helpers:** `src/mocks/store.ts`
- **Mock vote, claim and refund:** `src/mocks/actions.ts`. They run the same checks as the program and throw the same `Error Code: X` errors, so error toasts can be tested too.
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
- **Changes stick until reload:** created bounties, votes, claims and refunds all stay in memory. A reload resets everything to the samples.
- **Closing like the program:** claiming the last prize or refunding removes the bounty, like the program closing the account.
- **Transactions:** each mock transaction waits about 0.6s so loading states are visible, then returns a signature like `mock-tx-<time>`. Explorer links for these go nowhere.
- **No fully claimed bounty:** once every tier is claimed, the program closes the escrow, so that state never appears on-chain. That's why Explore filters by deadline (Open / Ending soon / Ended) and has no "Claimed" filter.

To add a sample, add another `escrow({...})` entry in `buildMockEscrows`.

## Progress

- [x] Mock data mode
- [x] Install reference skills
- [x] Phase 0: design decisions in `openbounty-ui` (approved)
- [x] Phase 1: design values, base components, page shell
  - [x] shadcn setup and theme
  - [x] shadcn base components
  - [x] Shared components (`common/`) and the `/dev/components` preview, see [components.md](components.md)
  - [x] New header with wallet menu and mobile nav
  - [x] Footer, `PageHeader`, mock banner on Tailwind; old Header/Footer removed
- [x] Phase 2: refactor Dashboard, BountyCard, Create form, Header
  - [x] Explore page (`/`): status filter with counts, new cards, loading/empty/error states, works without a wallet
  - [x] Header (done in Phase 1)
  - [x] Create page (`/create`): sectioned form, validation that matches the program (title counted in bytes, duplicate judges caught), toasts, success view with a "View bounty" link
  - [x] Old CSS variable block removed; no inline styles or hex colors left in components
- [x] Phase 3: bounty detail page, judge voting, `/me` page (replaces `/claim`), real claim and refund, 404 page
  - [x] Bounty detail page (`/bounty/[address]`): vote (auto-picks the winner at the threshold), claim, refund with confirmation, closed and not-found states. Tested in mock mode as judge, winner and organizer, at 1440px and 390px.
  - [x] "Your bounties" page (`/me`), linked in the nav. Replaces the broken `/claim` link.
  - [x] 404 page (`app/not-found.tsx`); `/claim` redirects to `/me` (`next.config.ts`)
- [x] Phase 4: loading/empty/error states, mobile layouts, accessibility, clean build
  - [x] Production build passes; `/dev/components` returns 404 in production
  - [x] Skip link, link focus outline, reduced motion, page titles, server-side 404 for bad bounty addresses
  - [x] Wallet picker restyled to match; Explore and detail checked at 768px and 1024px
  - [x] OpenBounty icon as favicon; create-next-app starter files removed; README rewritten

## How the refactor was checked

In mock mode, with a headless browser, at 1440px and 390px:
- **Create:** errors on an empty submit, the duplicate-judge error, a successful create, and the new bounty showing on Explore.
- **Detail, as a judge:** voting, with the winner picked automatically at the threshold.
- **Detail, as a winner:** claiming the last prize, which closes the bounty.
- **Detail, as an organizer:** refunding, which closes the bounty.
- **Bad address:** returns a 404.
- **Your bounties:** every section, the Vote link, and the logged-out prompt after Disconnect.
- **Keyboard:** the skip link comes first, focus rings are visible, and page titles are right.

Also: `tsc`, ESLint on the whole app and `next build` are clean. No inline styles, hex colors or emoji remain in components.

**Not checked:** real transactions on devnet. The deployed program is still v1 until it's redeployed.

Before calling a new page done, run the checklist at the end of `.claude/skills/openbounty-ui/SKILL.md`.
