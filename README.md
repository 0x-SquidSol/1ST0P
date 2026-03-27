# 1ST0P — Solana launchpad (devnet)

This repo contains:

- **`programs/1ST0P`** — Anchor program (crate **`onestop`**): permissionless token launches (**1 SOL** launch fee to treasury), **virtual + real SOL** constant-product bonding curve, **~1% (100 bps)** fee on **buys** (from SOL in) and **sells** (from SOL out).
- **`web`** — Next.js UI (Phantom wallet, devnet RPC, Pulse list, launch form, coin page with buy/sell).

Rust identifiers cannot start with a digit, so the on-chain crate/module is named **`onestop`** while the product name is **1ST0P**.

## Prereqs

Install Solana CLI, Rust, and Anchor on your machine (needed to build and deploy the program). See [Anchor book](https://www.anchor-lang.com/docs/installation).

## Program (Anchor)

```bash
cd programs/1ST0P
# After `anchor keys list`, set the same key in:
# - programs/1ST0P/src/lib.rs declare_id!(...)
# - Anchor.toml [programs.devnet]
anchor build
anchor deploy --provider.cluster devnet
```

After deployment, copy the generated IDL to the app (recommended so types stay in sync), or update `web/src/idl/onestop.json` and set:

- Optional `web/.env.local`: `NEXT_PUBLIC_PROGRAM_ID=<your_program_id>` and, if you want a custom RPC, `NEXT_PUBLIC_RPC=<url>`.

## Web app

```bash
cd web
npm install
npm run dev
```

Open the UI, connect Phantom on **Devnet**, fund the wallet with devnet SOL, then:

1. **Initialize** once (admin wallet): sets treasury and fee bps (UI uses 100 = 1%).
2. **Launch** tokens: costs **1 SOL** per launch (paid to treasury).
3. **Trade** on the bonding curve from **Pulse** or a coin page.

## Notes

- The program ID in repo should match your deployment (`declare_id!` / `Anchor.toml` / `web` IDL default).
- Always audit and test on devnet before any mainnet use. This is example software, not a security audit.
