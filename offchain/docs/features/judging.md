# Entries, judging board and scorecards (preview)

> **Status: frontend preview in mock mode only.**
> - **Entries:** these need a new program instruction, so they exist only in `yarn dev:mock` for now.
> - **Judging board:** its voting already uses the existing `vote_winner` instruction.
> - **Scorecards:** stored in the judge's browser, never on-chain.
>
> In normal mode the app behaves exactly as before.

## In one paragraph

Before this, judges voted on bare wallet addresses and never saw what anyone built. Now builders **submit an entry** (project name, link, short description) to a bounty, and everyone can browse the entries. Judges get a **judging board**: they privately **score** each entry on three criteria, compare their scores side by side, then drag an entry onto a prize to vote. The winner is still picked automatically once enough judges agree.

## What was built

| Where | What changed |
|---|---|
| **Bounty page** | Tabs: **Prizes**, **Submissions (N)**, and **Judging** (visible only to that bounty's judges) |
| **Submissions tab** | Every entry: name, who submitted it, when, description, a "View project" link, and badges such as "Won 1st prize" or "2 votes · 1st prize". Eligible builders see **Submit entry**; everyone else sees why they can't enter. |
| **Submit entry dialog** | Project name, link (only `https://` or `ipfs://`) and an optional description with a character count, with clear error messages |
| **Judging tab** | **Entries** on one side, **Prizes** on the other. Each prize shows its votes, "your vote", and a trophy for the winner. |
| **Scoring** | Rate an entry 1–5 for Innovation, Execution and Impact, with a note. The entry card shows "Your score 14/15". Sort entries by your score, or open **Compare scores** for a table of everything. |
| **Voting from the board** | Drag an entry onto a prize, or use **Vote as...** (works with a keyboard and on phones). A confirmation says whether your vote will pick the winner. |
| **Vote dialog on the Prizes tab** | Lists entries by project name instead of wallet addresses |
| **Sample data** | Every mock bounty has sample entries, and the existing sample votes point at them |

## How to try it

1. Run `yarn dev:mock` in `offchain/` and open http://localhost:3000. A test wallet connects automatically, and nothing is real.
2. **As a builder:** open **Community Meme Contest** (you have no role there), go to **Submissions** and click **Submit entry**. Your entry appears in the list marked "you".
3. **As a judge:** open **Design System for a DeFi Dashboard** and go to the **Judging** tab.
   - Click **Score** on two entries, then try **Sort: Your score** and **Compare scores**.
   - Drag **Ledgerline UI** onto **1st prize**. It already has 2 of 3 votes, so the confirmation says your vote picks the winner.
   - Use **Vote as...** on another entry for 2nd prize.
4. **As an organizer:** open **Build a Solana Wallet Tracker**. You can see its entries but can't enter it or judge it.

## How people use it

**Builders**
- Open a bounty, go to **Submissions**, and click **Submit entry**: name, link, one or two sentences.
- One entry per wallet per bounty, until the deadline.
- Submit from the wallet that should receive the prize. Judges vote for the submitting wallet, and a winning wallet claims the prize, as before.

**Judges**
- Open the **Judging** tab of a bounty you judge.
- Score entries as you review them. Only you can see your scores.
- Vote by dragging an entry onto a prize, or with **Vote as...**, then confirm. Votes are final, and each judge votes once per prize.

**Organizers**
- Share the bounty link. Entries arrive in **Submissions**, and progress shows on each prize.
- Organizers can't enter their own bounty.

**Everyone**
- Browse entries on any bounty: what was built, the links, and how the vote is going.

## How it benefits them

| Who | Benefit |
|---|---|
| **Builders** | **A clear place to submit** that judges will see, instead of sending a wallet address around. |
| | **Visibility:** your project is listed on the bounty, with a link, for anyone to see. |
| **Judges** | **Judge the work, not a wallet address:** every entry has a name, link and description. |
| | **A real process:** consistent criteria, private scores and a side-by-side comparison make fair decisions easier. |
| | **Fewer mistakes:** drag-and-drop or a menu instead of pasting addresses, and a confirmation that says exactly what your vote will do. |
| **Organizers** | **Credibility:** a transparent submission and judging process that builders can trust. |
| | **Everything in one place:** entries, votes and winners on the bounty page. |
| **Everyone** | **Transparency:** entries and vote progress are public, while judges' scores stay private until they vote. |

## Rules

**Who can enter:**
- anyone with a connected wallet, before the deadline
- except the organizer and the bounty's judges (conflict of interest)
- one entry per wallet

**Voting** follows the program's `vote_winner` rules:
- only the bounty's judges, before the deadline
- once per judge per prize
- no changes after voting
- the winner is picked automatically at the threshold

The same wallet may win more than one prize, as the program allows today.

**Scorecards** are private to the judge's browser and wallet. They're never sent anywhere and don't affect the vote by themselves.

## What's real and what's simulated

| Part | In this preview |
|---|---|
| Entries (submit, list) | Simulated in mock mode. They need a program change (below). |
| Voting from the board | Uses the same `vote` action as the Prizes tab: mocked in mock mode, and `vote_winner` on-chain once entries exist |
| Scorecards | Real: saved in the browser for each bounty and judge wallet. In mock mode the test wallet changes on every reload, so scores reset on reload; with a real wallet they persist. |
| Drag and drop | Real (browser drag and drop). **Vote as...** is the keyboard and touch alternative. |

## What it takes to make this real

For developers.

1. **Program: an entry account.**
   - A `submit_entry` instruction creates a `Submission` account at `["submission", escrow, submitter]`, so there's one per wallet per bounty.
   - It stores `title`, `url` and a short `description` (or a metadata link), plus `submitted_at`. The submitter pays the small rent.
   - It enforces the rules with these error codes (already mapped to plain English in `src/utils/txErrors.ts`):
     - `SubmissionsClosed`: after the deadline
     - `OrganizerCannotSubmit`
     - `JudgeCannotSubmit`
     - `AlreadySubmitted`
   - Optional: `withdraw_entry` before the deadline. Close entry accounts when the bounty closes, and return their rent.
2. **Frontend.**
   - In `useSubmissions`, load entries with `getProgramAccounts`, filtered by the bounty's address.
   - Send `submit_entry` from `submitEntry`.
   - Turn on `SUBMISSIONS_PREVIEW` (in `src/constants/submissions.ts`) outside mock mode.
   - The judging board and scorecards need no changes.
3. **A cheaper alternative with no program change:** post entries as Solana Memo transactions. That's simpler, but the program couldn't enforce the rules (anyone could spam entries), so the account approach is recommended.

## Where the code is

| File | Purpose |
|---|---|
| `src/types/submission.ts`, `src/constants/submissions.ts` | Entry type, limits, `SUBMISSIONS_PREVIEW` |
| `src/utils/submissions.ts` | Who may enter, validation, and mapping votes onto entries (`getVoteCandidates`, `votesPerTier`, `wonTiers`) |
| `src/utils/judging.ts` | Which prizes a judge can still vote on, and sorting entries |
| `src/utils/scorecard.ts`, `src/hooks/useScorecard.ts` | Criteria, totals, and browser storage |
| `src/hooks/useSubmissions.ts` | Loading entries and submitting a new one |
| `src/components/submissions/` | Submissions tab, entry card, submit dialog |
| `src/components/judging/` | Judging board, board card, prize column, score, compare and confirm dialogs |
| `src/components/bounty/BountyTabs.tsx` | The Prizes, Submissions and Judging tabs |
| `src/mocks/submissions.ts`, `src/mocks/actions.ts` (`mockSubmit`) | Sample entries, and a mock submit with the same rules |
