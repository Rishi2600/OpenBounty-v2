# Components

Our own shared components. For the shadcn ones (`Button`, `Card`, `Badge`, ...) see `src/components/ui/` and the tweaks table in [README.md](README.md).

To see everything in one place, run `yarn dev:mock` and open **http://localhost:3000/dev/components**. That page exists only in development and returns a 404 in production.

## explore/

| Component | What it shows |
|---|---|
| `ExploreBounties` | The whole home page:<br>• status filter with counts<br>• in mock mode, a prize-asset filter too (All assets, SOL, USDC, ...)<br>• sorted grid (running bounties with the nearest deadline first, then ended ones)<br>• loading, empty, filtered-empty and error states |

## news/

| Component | What it shows | Props |
|---|---|---|
| `NewsFeed` | "Around Solana" section below the bounties on the home page: heading, a "Sample" badge while `NEWS_IS_SAMPLE` is true, a "More news" link to solana.com/news, and a grid of `NewsCard`s with loading, empty and error states | none |
| `NewsCard` | Source and time ago, headline, a 2-line summary and "Read more". The whole card opens the article in a new tab (announced to screen readers). | `item` (`NewsItem`) |
| `NewsCardSkeleton` | Loading placeholder with the same shape | none |

## layout/

| Component | What it does |
|---|---|
| `SiteHeader` | Sticky top bar: logo, nav links, a "Create bounty" button (hidden on phones) and `WalletButton`. Below `md` the links move into `MobileNav`. |
| `MobileNav` | Menu button (phones only) that opens the nav links and "Create bounty" in a left-side sheet. The sheet closes on navigation. |
| `WalletButton` | Logged out: "Connect wallet" opens the wallet picker. Connected: a menu with the wallet name, balance, copy address, explorer link, change wallet and disconnect. |
| `SiteFooter` | One-line footer. A server component (no `"use client"`). |
| `PageHeader` | Page title (`h1`, serif) with an optional description and optional actions on the right. They stack on phones. Use it at the top of every page. |
| `MockBanner` | Strip shown above the header only in mock mode |
| `navLinks.ts` | `NAV_LINKS` (the list of links) and `isActivePath()`. Add a page to the nav here and both headers pick it up. |

Page layout: `app/layout.tsx` wraps every page in `<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">`, so pages shouldn't add their own outer container.

`useBalance()` (in `src/hooks/`) returns the connected wallet's balance in lamports, or `null`.

## common/

| Component | What it shows | Props |
|---|---|---|
| `Address` | A shortened address (`AbCd...WxYz`) with the full value in a tooltip and a copy button. The copy button shows a toast. | `address`, `isYou?` (adds a "you" tag), `className?` |
| `TokenAmount` | An amount in the asset's base units as text (`12.5 SOL`, `2,500 USDC`) in the highlight color, with digits that line up. Replaced `SolAmount` when prizes became multi-asset. | `amount` (BN), `asset`, `className?` |
| `EmptyState` | An icon, a title, an optional description and at most one action, for lists with nothing in them | `icon` (lucide icon), `title`, `description?`, `action?` |
| `ErrorState` | A plain-English error with a "Try again" button (`role="alert"`) | `message?`, `onRetry?` |
| `StatCard` | An uppercase label above one value | `label`, `value` (text or a node such as `TokenAmount`) |

| `FormField` | Label, input (children), and helper text that an error replaces (`role="alert"`, red). Give the input `id` and `aria-describedby={messageId(id)}`. | `id`, `label`, `helper?`, `error?`, `children` |
| `FilterButtons` | A row of toggle buttons (`aria-pressed`) with optional counts, which wrap on phones. Used for filters instead of Tabs, because Tabs expect content panels. | `label` (for screen readers), `options` (`{ value, label, count? }[]`), `value`, `onChange` |

## bounty/

| Component | What it shows | Props |
|---|---|---|
| `BountyCard` | Title, status, prize pool, your role, "x of y prizes decided", and the deadline. The whole card links to `/bounty/[address]`. Your own bounties get the ochre glow. | `escrow`, `viewer` (the connected wallet or `null`) |
| `BountyCardSkeleton` | Loading placeholder with the same shape | none |
| `BountyStatusBadge` | "Open" (green), "Ending soon" (ochre), "Ended" (muted). Styles come from `STATUS_STYLES`. | `status` |
| `TierStatusBadge` | "Awaiting votes", "Voting · 2 of 3", "Winner picked", "Claimed", or "No winner" after the deadline | `progress` (from `getTierProgress`), `threshold`, `isEnded` |
| `TierCard` | One prize on the detail page: place and amount, status, then either the winner or a vote progress bar with each candidate's votes. Shows "Vote for a winner" to judges who haven't voted (before the deadline) and "Claim X SOL" to an unclaimed winner. | `escrow`, `tierIndex`, `viewer`, `isEnded`, `pending`, `onVote`, `onClaim` |
| `VoteDialog` | Lets a judge vote on one prize: current candidates as pick buttons (with vote counts) plus an address field. Says votes can't be changed. | `open`, `prizeLabel`, `threshold`, `tallies`, `submitting`, `onOpenChange`, `onSubmit(candidate)` |
| `RefundDialog` | Confirms a refund and warns that the bounty closes and unclaimed winners lose their prize | `open`, `amountText`, `submitting`, `onOpenChange`, `onConfirm` |
| `BountyDetail` | The whole `/bounty/[address]` page:<br>• loading, error, not found, and a "Bounty closed" state after you close it<br>• header with status and your roles<br>• a "connect wallet" hint when logged out<br>• a refund panel for the organizer after the deadline<br>• tier cards, the details panel, and the vote and refund dialogs<br><br>Every action ends in a success or error toast and a refetch. | `address` |
| `BountyDetailsPanel` | Side panel on the detail page: prize pool and amount still locked, deadline (relative and full date), prize asset (for USDC, the chains winners can be paid on), judges with "N of M votes to win", organizer, escrow account, and the organizer's details link | `escrow`, `viewer` |
| `BountyDetailSkeleton` | Loading placeholder for the detail page | none |
| `RoleBadges` | "You organize", "You judge", "You won". Renders nothing when you have no role. | `roles` (from `getViewerRoles`) |

## me/

| Component | What it shows | Props |
|---|---|---|
| `MyBounties` | The whole `/me` page:<br>• a connect prompt when logged out, plus loading and error states<br>• stats: organizing, judging, SOL ready to claim<br>• to-do sections: "Needs your vote", "Ready to claim", "Refund available", or "Nothing needs you right now"<br>• "Organizing" and "Judging" grids | none |
| `TaskRow` | One to-do: bounty title, prize and amount, and a button that opens the bounty page (where the action happens) | `href`, `title`, `detail`, `actionLabel` |
| `TaskSection` | Heading with a count and a list of `TaskRow`s. Renders nothing when empty. | `title`, `count`, `children` |
| `BountyGridSection` | Heading with a count and a grid of `BountyCard`s, or a short note (and optional action) when empty | `title`, `escrows`, `viewer`, `emptyText`, `emptyAction?` |

## create/

The create form is split into sections.

`CreateBountyForm` owns the state, the validation display and the submit:
- **Errors:** they appear only after the first submit attempt, and are recomputed on every render from `validateForm` (no effects).
- **Blank rows:** empty judge and prize rows are ignored.
- **Logged out:** submit opens the wallet picker.
- **Submitting:** a spinner shows "Confirming...". Success shows `CreateSuccess`; a failure shows a toast from `friendlyTxError`.

The validation rules and the transaction live in `hooks/useCreateBounty.ts`.

| Component | What it shows | Props |
|---|---|---|
| `AssetPicker` | "Prize asset" cards (SOL, USDC, USDT, BONK, JUP), built on native radio buttons. Shown only in mock mode (`MULTI_ASSET_PREVIEW`). | `value`, `onChange` |
| `JudgesField` | Up to 5 judge address inputs (add and remove), plus the "votes needed" number with a live "out of N judges" hint | `judges`, `threshold`, `judgesError?`, `thresholdError?`, `onJudgesChange`, `onThresholdChange` |
| `PrizeTiersField` | Up to 4 amounts in the chosen asset labelled "1st prize", "2nd prize", ..., plus the live total to lock. Amounts are kept as text so a half-typed "0." works. | `asset`, `amounts`, `error?`, `onChange` |
| `CreateSuccess` | Confirmation, an explorer link (or "Mock transaction" in mock mode), and "View bounty" / "Create another" | `signature`, `address`, `onCreateAnother` |

Buttons inside the form that don't submit need `type="button"`; a plain `<button>` inside a `<form>` submits it.

The glow uses the `shadow-glow` class, defined as `--shadow-glow` in `globals.css`.

```tsx
<EmptyState
  icon={Inbox}
  title="No bounties yet"
  description="Bounties you create will show up here."
  action={<Button asChild><Link href="/create">Create bounty</Link></Button>}
/>
```
