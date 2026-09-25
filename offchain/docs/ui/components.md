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

```tsx
<EmptyState
  icon={Inbox}
  title="No bounties yet"
  description="Bounties you create will show up here."
  action={<Button asChild><Link href="/create">Create bounty</Link></Button>}
/>
```
