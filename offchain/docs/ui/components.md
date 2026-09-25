# Components

Our own shared components. For the shadcn ones (`Button`, `Card`, `Badge`, ...) see `src/components/ui/` and the tweaks table in [README.md](README.md).

To see everything in one place, run `yarn dev:mock` and open **http://localhost:3000/dev/components**. That page exists only in development and returns a 404 in production.

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
