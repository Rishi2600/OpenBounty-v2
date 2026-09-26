# OpenBounty frontend

Next.js app for OpenBounty, the Solana bounty escrow in `../onchain`:
- **Organizers** lock a prize pool.
- **Judges** vote on winners.
- **Winners** claim directly.
- **Organizers** refund anything unclaimed after the deadline.

## Run it

```bash
yarn install
yarn dev:mock   # sample data, no chain, a throwaway wallet connects automatically
yarn dev        # real program on devnet (connect Phantom or Solflare)
```

Open http://localhost:3000. Other commands: `yarn build`, `yarn start`, `yarn lint`.

## Pages

| Route | Page |
|---|---|
| `/` | Explore every bounty, filtered by Open, Ending soon or Ended |
| `/bounty/[address]` | One bounty: judges vote, winners claim, the organizer refunds |
| `/create` | Create a bounty |
| `/me` | Your bounties: votes, claims and refunds to do, plus what you organize and judge |

## Where things are

- **UI docs:** [`docs/ui/`](docs/ui/README.md) covers styling, the code map, mock mode, the component guide and progress.
- **Entries, judging board and scorecards (preview):** [`docs/features/judging.md`](docs/features/judging.md)
- **Multi-asset and multichain prizes (preview):** [`docs/multichain/`](docs/multichain/README.md) covers what it does, how to use it, the benefits, and what's needed to make it real.
- **Design rules:** [`../.claude/skills/openbounty-ui/SKILL.md`](../.claude/skills/openbounty-ui/SKILL.md) covers colors, type, patterns and code rules.
- **Program connection:**
  - The program ID and limits are in `src/constants/program.ts`.
  - The IDL and types are in `src/idl/` and `src/types/onchain/`.
  - After changing the program, copy `onchain/target/idl` and `onchain/target/types` back into those folders.
