# Components

Our own shared components. For the shadcn ones (`Button`, `Card`, `Badge`, ...) see `src/components/ui/` and the tweaks table in [README.md](README.md).

To see everything in one place, run `yarn dev:mock` and open **http://localhost:3000/dev/components**. That page exists only in development and returns a 404 in production.

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
| `SolAmount` | Lamports as SOL (`12.5 SOL`) in the highlight color, with digits that line up | `lamports` (BN), `className?` |
| `EmptyState` | An icon, a title, an optional description and at most one action, for lists with nothing in them | `icon` (lucide icon), `title`, `description?`, `action?` |
| `ErrorState` | A plain-English error with a "Try again" button (`role="alert"`) | `message?`, `onRetry?` |
| `StatCard` | An uppercase label above one value | `label`, `value` (text or a node such as `SolAmount`) |

| `FormField` | Label, input (children), and helper text that an error replaces (`role="alert"`, red). Give the input `id` and `aria-describedby={messageId(id)}`. | `id`, `label`, `helper?`, `error?`, `children` |
| `FilterButtons` | A row of toggle buttons (`aria-pressed`) with optional counts, which wrap on phones. Used for filters instead of Tabs, because Tabs expect content panels. | `label` (for screen readers), `options` (`{ value, label, count? }[]`), `value`, `onChange` |

## bounty/

| Component | What it shows | Props |
|---|---|---|
| `BountyCard` | Title, status, prize pool, your role, "x of y prizes decided", and the deadline. The whole card links to `/bounty/[address]`. Your own bounties get the ochre glow. | `escrow`, `viewer` (the connected wallet or `null`) |
| `BountyCardSkeleton` | Loading placeholder with the same shape | none |
| `BountyStatusBadge` | "Open" (green), "Ending soon" (ochre), "Ended" (muted). Styles come from `STATUS_STYLES`. | `status` |
| `RoleBadges` | "You organize", "You judge", "You won". Renders nothing when you have no role. | `roles` (from `getViewerRoles`) |

## create/

The create form is split into sections. The form component (`CreateBountyForm`) owns the state and passes values and errors down.

| Component | What it shows | Props |
|---|---|---|
| `JudgesField` | Up to 5 judge address inputs (add and remove), plus the "votes needed" number with a live "out of N judges" hint | `judges`, `threshold`, `judgesError?`, `thresholdError?`, `onJudgesChange`, `onThresholdChange` |
| `PrizeTiersField` | Up to 4 SOL amounts labelled "1st prize", "2nd prize", ..., plus the live total to lock. Amounts are kept as text so a half-typed "0." works. | `amounts`, `error?`, `onChange` |
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
