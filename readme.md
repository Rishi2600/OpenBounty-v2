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


## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Anchor |
| Blockchain | Solana (Devnet) |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Wallet | Phantom / Backpack |