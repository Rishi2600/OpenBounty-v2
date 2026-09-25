---
name: openbounty-ui
description: OpenBounty UI rules and design decisions. Use when building, refactoring or reviewing any page, component or style in offchain/.
---

# OpenBounty UI rules

The single source of truth for how the OpenBounty frontend looks and is built. When these rules conflict with a reference skill, these rules win.

> **Status: proposed (Phase 0).** Waiting for approval before Phase 1 starts.

## Reference skills

| Skill | Use it for |
|---|---|
| `ui-ux-pro-max` | UX rules (`--domain ux`), stack notes (`--stack shadcn`, `--stack nextjs`), and its pre-delivery checklist before calling a page done. Don't adopt its generic palettes or fonts; the look is decided below. |
| `design-system` | How design values are layered: base values → meaning → component |
| `ui-styling` | shadcn and Tailwind reference. Ignore `tailwind_config_gen.py`: it targets Tailwind v3, and we configure v4 in CSS with `@theme`. |

Run searches from the repo root:
`python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux`

## Stack

- **Framework:** Next.js 16 (App Router) and React 19
- **Styling:** Tailwind v4, configured in `app/globals.css`. There is no `tailwind.config` file.
- **Components:** shadcn/ui, generated into `src/components/ui/`
- **Icons:** `lucide-react`
- **Toasts:** `sonner` (through shadcn)
- **Forms:** plain `useState` with a validate function (like `validateForm` in `useCreateBounty`). No react-hook-form or zod.

## Look

- **Keep the current identity:** warm dark brown with ochre highlights.
- **Dark theme only for now.** Colors are defined by meaning (below), so a light theme can be added later without touching components.
- **Background:** keep the soft ochre glow at the top of the page. The grain texture stays.
- **Contrast:** every text color below is at least 4.5:1 on both the page and card backgrounds.

### Colors

Base values live in `globals.css` only. Components use the meaning-based names through Tailwind classes such as `bg-card`, `text-muted-foreground` and `border-border`.

| Name (shadcn) | Value | Used for |
|---|---|---|
| `background` | `#1A100A` | Page |
| `foreground` | `#F5EFE6` | Main text (16:1) |
| `card` | `#2C1A0F` | Cards, panels |
| `popover` | `#2C1A0F` | Menus, dialogs |
| `primary` | `#C8860A` ochre | Main buttons, active tab, focus ring |
| `primary-foreground` | `#1A100A` | Text on ochre (6.1:1) |
| `secondary` / `muted` | `#4A2E1A` | Quiet buttons, input backgrounds, tier rows |
| `muted-foreground` | `#C4B49E` | Secondary text (8.2:1 on card) |
| `accent` | ochre at 15% | Hover backgrounds, selected items |
| `accent-foreground` | `#F0C060` | Text on accent |
| `destructive` | `#E06C52` | Errors, refund, danger. Button text uses `#1A100A` (5.7:1). |
| `success` (custom) | `#9DBD72` | Claimed, winner, success toasts |
| `highlight` (custom) | `#F0C060` | SOL amounts, key numbers |
| `border` / `input` | brown `#6B4226` at 40% | All borders |
| `ring` | `#C8860A` | Keyboard focus |

Rules:
- No hex values or `style={{}}` color objects in components.
- Never fade text with `opacity`; use `text-muted-foreground`.
- `#8C6248` (brown-muted) is for borders and dividers only. As text it's 3.1:1, which fails.

### Type

| Role | Font | Notes |
|---|---|---|
| Page and card titles | DM Serif Display | The only serif. Playfair Display is removed. |
| Everything else | DM Sans | Body, labels, buttons |
| SOL amounts, counts | DM Sans semibold, `tabular-nums` | Digits line up in lists |
| Addresses, signatures | JetBrains Mono | Replaces Courier New |

- **Sizes:** use Tailwind's scale. Body is `text-base` (16px); `text-sm` for secondary text. `text-xs` (12px) is the minimum and only for labels and meta.
- **Uppercase labels:** `text-xs font-semibold uppercase tracking-wider text-muted-foreground`

### Spacing and shape

- **Spacing:** Tailwind's 4px scale.
- **Page container:** `mx-auto max-w-6xl px-4 sm:px-6`. Vertical rhythm is `py-10` for pages, `gap-8` between sections and `gap-4` inside them.
- **Corners:** `--radius: 0.625rem` (10px), shadcn's default. Cards use `rounded-xl` and controls `rounded-md`.
- **Shadows:** cards use a border and `bg-card`, not heavy shadows. The ochre glow is only for the organizer's own cards.

## Pages

| Route | Page | Status |
|---|---|---|
| `/` | **Explore:** all bounties, filter by Open, Ending soon or Ended | Refactor |
| `/bounty/[address]` | **Bounty detail:** tiers with vote progress, judges, organizer. Actions depend on your role: vote (judge), claim (winner), refund (organizer, after the deadline). | New |
| `/create` | **Create bounty** form | Refactor |
| `/me` | **Your bounties:** "Needs your vote", "Ready to claim", "Refund available", "Organizing". Replaces the broken `/claim` link. | New |
| not found | `app/not-found.tsx` with a link home | New |

### Status names users see

- **Bounty:** `Open` (before the deadline), `Ending soon` (under 24 hours left), `Ended` (after the deadline).
- **Tier:** `Awaiting votes`, `Voting · 2 of 3`, `Winner picked`, `Claimed`.
- There is no "Claimed" status for a whole bounty: the program closes a bounty once every tier is claimed.

## Components

### shadcn components used

`button`, `card`, `badge`, `input`, `label`, `textarea`, `tabs`, `dialog`, `dropdown-menu`, `sheet` (mobile menu), `sonner`, `skeleton`, `progress`, `tooltip`, `separator`, `alert`.

Treat files in `src/components/ui/` as generated: change them only for theme-wide tweaks, and note the change in the docs.

### Our own components

| Folder | Contents |
|---|---|
| `components/layout/` | `SiteHeader`, `SiteFooter`, `PageHeader`, `WalletButton` (dropdown), `MockBanner` |
| `components/common/` | `Address` (shortened, with a copy button), `SolAmount`, `EmptyState`, `StatCard`, `ErrorState` |
| `components/bounty/` | `BountyCard`, `BountyStatusBadge`, `TierRow`, `VoteProgress`, `BountyActions` |
| `components/create/` | The create form, split into sections |

## Patterns

- **Three states for every data view:**
  - **Loading:** a `Skeleton` shaped like the real content, never a blank screen.
  - **Empty:** `EmptyState` with a short message and one action ("No bounties yet" → Create bounty).
  - **Error:** `ErrorState` with a plain-English message and a Retry button.
- **Transactions:**
  - **While pending:** the button disables and shows a spinner with "Confirming…".
  - **On success:** a toast with an explorer link. Mock mode says "Mock transaction" instead.
  - **On failure:** a toast with a plain-English message. Program errors are mapped in one place, `utils/txErrors.ts`.
  - The page never freezes.
- **Forms:**
  - Every field has a visible label, never a placeholder alone.
  - Helper text sits under the field. An error replaces the helper text, in `text-destructive`, with `role="alert"`.
  - Errors show after the first submit attempt, then update live.
  - Submit shows loading, then the result.
- **Icons:** `lucide-react` only, no emoji. An icon-only button needs an `aria-label`.
- **Accessibility:**
  - Every interactive element shows a visible focus ring (shadcn default).
  - Touch targets are at least 44×44px on mobile.
  - Status is never shown by color alone; badges always have text.
- **Motion:** transitions are 150–200ms on hover and focus only. Wrap anything larger in `motion-safe:`.
- **Responsive:**
  - Build for mobile first, then add `sm:`, `md:` and `lg:`.
  - Check at 375, 768, 1024 and 1440px, with no sideways scroll.
  - On mobile the header navigation moves into a `Sheet`.
- **Server vs client:** add `"use client"` only where hooks or events are needed. Wallet-dependent pages are client components; keep static parts such as the footer on the server.

## Code rules

- Function components with a named `Props` interface, one component per file, files under about 200 lines.
- Early returns, no nested ternaries, no clever generics or abstractions.
- Tailwind classes written directly. Use `cn()` only to merge conditional classes.
- For our own variants, use a plain object map (for example `STATUS_STYLES[status]`); `cva` stays inside shadcn files.
- Each component file starts with a one-line comment saying what it's for.
- Update `offchain/docs/ui/` in the same commit as the change.
- Test every screen with `yarn dev:mock` (see `offchain/docs/ui/README.md`).

## Before calling a page done

1. Loading, empty and error states exist.
2. Keyboard only: everything can be reached and the focus ring is visible.
3. Checked at 375px and 1440px widths.
4. No hex colors, inline `style` or emoji in the new code.
5. `npx tsc --noEmit` and ESLint are clean for the touched files.
