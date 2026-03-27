import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "5VT57qmHnPuYJaaaXc2fzeywvL9hatirgPggndr1aydk",
);

/** Matches on-chain: 30 SOL virtual depth */
export const VIRTUAL_SOL_LAMPORTS = BigInt(30_000_000_000);
export const LAUNCH_FEE_SOL = 1;
export const DEFAULT_SLIPPAGE_BPS = 100;
/** 1% — typical launchpad trading fee (buy and sell). */
export const DEFAULT_FEE_BPS = 100;

export const TOKEN_DECIMALS = 6;
