"use client";

import { SystemProgram, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";
import { DEFAULT_FEE_BPS } from "@/lib/constants";
import { globalConfigPda } from "@/lib/pdas";
import { programFor } from "@/lib/program";

function parsePk(s: string): PublicKey | null {
  try {
    return new PublicKey(s.trim());
  } catch {
    return null;
  }
}

export function InitializeLaunchpad({
  onInitialized,
}: {
  onInitialized?: () => void;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [treasuryInput, setTreasuryInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setErr(null);
    if (!wallet.publicKey || !wallet.signTransaction) {
      setErr("Connect wallet first.");
      return;
    }
    const treasury = parsePk(treasuryInput);
    if (!treasury) {
      setErr("Enter a valid treasury address.");
      return;
    }
    setBusy(true);
    try {
      const program = programFor(connection, wallet.wallet);
      const sig = await program.methods
        .initialize(DEFAULT_FEE_BPS)
        .accounts({
          authority: wallet.publicKey,
          treasury,
          globalConfig: globalConfigPda(),
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await connection.confirmTransaction(sig, "confirmed");
      onInitialized?.();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Initialize failed");
    } finally {
      setBusy(false);
    }
  }, [connection, onInitialized, treasuryInput, wallet]);

  return (
    <div
      id="init"
      className="rounded-2xl border border-dashed border-white/20 bg-zinc-950/40 p-6"
    >
      <h3 className="text-sm font-semibold text-zinc-100">
        One-time: initialize launchpad config
      </h3>
      <p className="mt-1 text-sm text-zinc-400">
        Deploy the program, then run this once with your admin wallet. Sets a{" "}
        <span className="text-zinc-200">1% (100 bps)</span> fee on buys and
        sells, and the treasury that receives launch fees + trading fees.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs text-zinc-500">
          Treasury public key
          <input
            value={treasuryInput}
            onChange={(e) => setTreasuryInput(e.target.value)}
            placeholder="Address that receives 1 SOL per launch + fees"
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-white/25"
          />
        </label>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="rounded-xl border border-white/15 bg-gradient-to-r from-zinc-200 to-zinc-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-black/20 disabled:opacity-50"
        >
          {busy ? "Working…" : "Initialize"}
        </button>
      </div>
      {err ? (
        <p className="mt-3 text-xs text-red-400">{err}</p>
      ) : null}
    </div>
  );
}
