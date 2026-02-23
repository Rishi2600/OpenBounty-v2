# OpenBounty-v2 · Local Setup Guide

> A step-by-step guide to get this **Solana + Anchor + Next.js** dApp running on your machine.

## 01 · Prerequisites & Dependencies

### Rust & Cargo

The Anchor smart contract is written in Rust — you'll need the full toolchain.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# After install, reload your shell:
source $HOME/.cargo/env
rustc --version  # should print rustc 1.7x.x
```

### Solana CLI

Required to manage wallets, deploy programs, and interact with the network.

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# Follow the installer prompt to add Solana to PATH, then verify:
solana --version
```

### Anchor CLI via AVM

AVM (Anchor Version Manager) lets you manage Anchor versions cleanly.

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
anchor --version  # e.g. anchor-cli 0.30.x
```

> ⚠️ **Linux users:** You may need extra system packages first:
> ```bash
> sudo apt-get install pkg-config build-essential libudev-dev libssl-dev
> ```

### Node.js (v18+) & Yarn

Required for the Next.js frontend in the `app/` folder.

```bash
# Using nvm (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18 && nvm use 18
node --version   # v18.x.x or higher

# Install yarn globally (optional but common in Anchor projects):
npm install -g yarn
```

---

## 02 · Clone & Install

### Clone the repository

```bash
git clone https://github.com/Rishi2600/OpenBounty-v2.git
cd OpenBounty-v2
```

### Install all dependencies (root + app)

The root `package.json` uses `"workspaces": ["app"]`, so a single install from the root handles everything — no need to `cd app` separately.

```bash
yarn install  # installs root deps + app/ deps in one shot
```

> 💡 Yarn Workspaces hoists shared packages to the root `node_modules/`, keeping installs fast and deduplicated.

---

## 03 · Solana Wallet Setup

### Generate a local keypair

This keypair signs transactions and pays for program deployment.

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana address  # prints your public key
```

### Point the CLI to Devnet & airdrop SOL

```bash
solana config set --url devnet
solana airdrop 2   # get 2 SOL for gas
solana balance     # confirm balance
```

> ℹ️ You can also use `solana config set --url localhost` if you prefer running a local validator instead.

---

## 04 · Build & Deploy the Smart Contract

### Build the Anchor program

Compiles `programs/hack-escrow` and generates the IDL file.

```bash
# From repo root:
anchor build
```

> ⚠️ The first build can take **2–5 minutes** as Rust compiles all dependencies. Subsequent builds are much faster.

### Check your program ID

```bash
anchor keys list  # lists the program ID for hack-escrow
```

> 💡 The program ID in `Anchor.toml` must match the `declare_id!` macro in `programs/hack-escrow/src/lib.rs`. If they differ, run:
> ```bash
> anchor keys sync
> ```

### Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### (Optional) Run Anchor tests

Validates program logic using the TypeScript test suite.

```bash
anchor test  # spins up a local validator, deploys, and runs tests
```

---

## 05 · Configure the Frontend

### Create the `.env.local` file

The Next.js app needs environment variables pointing to your deployed program.

```bash
cd app
cp .env.example .env.local  # if an example exists, otherwise create manually
```

Populate `.env.local` with:

```env
NEXT_PUBLIC_PROGRAM_ID=<YOUR_PROGRAM_ID>
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

> 💡 Replace `<YOUR_PROGRAM_ID>` with the value from `anchor keys list`. Check `app/` source files for any additional env vars that may be required.

### Ensure the IDL is accessible to the frontend

The frontend uses the Anchor-generated IDL to call on-chain instructions.

```bash
# IDL is generated here after anchor build:
ls target/idl/hack_escrow.json

# Copy it into app/ if the frontend references a local IDL path:
cp target/idl/hack_escrow.json app/src/idl/  # adjust path as needed
```

---

## 06 · Run the Frontend

### Start the Next.js dev server

```bash
cd app
yarn dev   # or: npm run dev
```

Open **http://localhost:3000** in your browser.

### Connect a Solana wallet

Install the [Phantom](https://phantom.app) or [Backpack](https://backpack.app) browser extension, then switch it to **Devnet**:

- **Phantom:** Settings → Developer Settings → Change Network → **Devnet**
- Import your local keypair or create a new wallet and airdrop SOL to it via the app or `solana airdrop`.

---

## 07 · Troubleshooting

### Build fails — Rust version mismatch

```bash
rustup update stable
```

### Airdrop fails on Devnet

Devnet faucet can be rate-limited. Use a web faucet instead:
- [faucet.solana.com](https://faucet.solana.com)
- [faucet.quicknode.com](https://faucet.quicknode.com)

Paste your wallet address and request Devnet SOL there.

### Program ID mismatch error

Keep `Anchor.toml`, `declare_id!` in `lib.rs`, and `NEXT_PUBLIC_PROGRAM_ID` in `.env.local` in sync:

```bash
anchor keys sync  # auto-updates Anchor.toml and lib.rs
```

Then update `.env.local` manually to match.

### Node module errors in `app/`

A clean install usually resolves version conflicts:

```bash
cd app
rm -rf node_modules .next
yarn install && yarn dev
```