import type { Idl } from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "@/idl/onestop.json";

const idlTyped = idl as Idl;

export function programFor(
  connection: Connection,
  wallet: WalletContextState["wallet"],
) {
  const adapter = wallet?.adapter;
  if (!adapter) throw new Error("Wallet not ready");
  const provider = new AnchorProvider(
    connection,
    adapter as never,
    { commitment: "confirmed", preflightCommitment: "confirmed" },
  );
  return new Program(idlTyped, provider);
}
