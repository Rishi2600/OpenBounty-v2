# OpenBounty-v2

A decentralized bounty platform built on Solana.

---

## Project Structure

```
OpenBounty-v2/
├── offchain/                   # Next.js frontend
│   ├── app/                    # Next.js app router
│   ├── public/                 # Static assets
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── yarn.lock
│
├── onchain/                    # Anchor smart contract
│   ├── programs/               # Rust program source
│   ├── migrations/             # Deploy scripts
│   ├── tests/                  # Anchor TypeScript tests
│   ├── app/                    # Anchor placeholder (unused)
│   ├── target/                 # Build output (gitignored)
│   ├── Anchor.toml
│   ├── Cargo.toml
│   ├── rust-toolchain.toml
│   ├── tsconfig.json
│   ├── package.json
│   └── yarn.lock
│
└── .gitignore
```

---

## Prerequisites

Make sure you have the following installed before proceeding.

- **Rust** — https://rustup.rs
- **Solana CLI** — https://docs.solana.com/cli/install-solana-cli-tools
- **Anchor CLI (via AVM)** — https://www.anchor-lang.com/docs/installation
- **Node.js v18+** — https://nodejs.org
- **Yarn** — `npm install -g yarn`

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Rishi2600/OpenBounty-v2.git
cd OpenBounty-v2
```

---

### 2. Set up the Solana wallet

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 2
solana balance
```

---

### 3. Set up the onchain program

```bash
cd onchain
yarn install
```

Generate a fresh program keypair and sync the program ID:

```bash
mkdir -p target/deploy
solana-keygen new -o target/deploy/hack_escrow-keypair.json --force
anchor keys sync
anchor keys list   # copy this ID — you'll need it in step 5
```

Build and deploy:

```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

### 4. Set up the offchain frontend

```bash
cd ../offchain
yarn install
```

---

### 5. Configure environment variables

Create `offchain/.env.local`:

```env
NEXT_PUBLIC_PROGRAM_ID=<ID from anchor keys list>
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

---

### 6. Copy the generated IDL to the frontend

```bash
cp onchain/target/idl/hack_escrow.json offchain/app/idl/
```

> Adjust the destination path to wherever your frontend imports the IDL from.

---

### 7. Run the frontend

```bash
cd offchain
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Connect a Solana wallet (Phantom or Backpack) set to **Devnet**.

---

### Solana program architecture and instructions used - 
 
```
OpenBounty Program
├─ 4 Instructions (Complete Lifecycle)
│  1. initialize_escrow    - Lock funds upfront
│  2. finalize_winner      - Multi-sig judge voting
│  3. claim_prize          - Permissionless claiming
│  4. refund_unclaimed     - Automatic refunds
│
├─ 2 PDAs (Data Storage)
│  1. Escrow Account       - Metadata + state
│  2. Vault Account        - SOL storage
│
├─ 15 Error Types (Comprehensive Validation)
│  - Authorization errors
│  - State validation errors
│  - Timing errors
│
└─ 19 Tests (Full Coverage)
   - Success scenarios
   - Edge cases
   - Attack prevention
```

---
 
## program core instructions  
 
### 1. Trustless Fund Locking
- Organizer locks funds in PDA vault at creation
- No private key for vault (program-controlled)
- Funds cannot be withdrawn before deadline
- Guarantees prizes exist upfront
 
### 2. Multi-Signature Judge Voting
- 5 judges, 3-of-5 threshold (configurable)
- Ed25519 signature verification
- Byzantine fault tolerant
- Permissionless submission (anyone can submit valid signatures)
 
### 3. Permissionless Prize Claiming
- Winners claim anytime after finalization
- No organizer approval needed
- Instant transfers (one transaction)
- Cannot claim twice (idempotency)
 
### 4. Automatic Refund System
- Deadline-based access control
- Only refunds unclaimed prizes
- Preserves claimed prizes
- Organizer only pays for claimed prizes
 
---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Anchor |
| Blockchain | Solana (Devnet) |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Wallet | Phantom / Backpack |