"use client";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { fetchGlobalConfigState } from "@/lib/accounts";
import { LAUNCH_FEE_SOL } from "@/lib/constants";
import { bondingCurvePda, globalConfigPda } from "@/lib/pdas";
import { programFor } from "@/lib/program";

export function LaunchCoin({ onCreated }: { onCreated?: () => void }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const g = await fetchGlobalConfigState(connection);
      setReady(g !== null);
    })();
  }, [connection]);

  const run = useCallback(async () => {
    setErr(null);
    if (!wallet.publicKey || !wallet.signTransaction) {
      setErr("Connect wallet first.");
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setErr("Name and symbol required.");
      return;
    }
    const g = await fetchGlobalConfigState(connection);
    if (!g) {
      setErr("Launchpad not initialized yet.");
      return;
    }

    const mint = Keypair.generate();
    const curve = bondingCurvePda(mint.publicKey);
    const curveAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      curve,
      true,
    );

    setBusy(true);
    try {
      const program = programFor(connection, wallet.wallet);
      const sig = await program.methods
        .createMemecoin(name.trim(), symbol.trim(), uri.trim() || " ")
        .accounts({
          creator: wallet.publicKey,
          globalConfig: globalConfigPda(),
          treasury: g.treasury,
          bondingCurve: curve,
          mint: mint.publicKey,
          curveTokenAccount: curveAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc();

      await connection.confirmTransaction(sig, "confirmed");
      onCreated?.();
      setName("");
      setSymbol("");
      setUri("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setBusy(false);
    }
  }, [connection, name, onCreated, symbol, uri, wallet]);

  if (!ready) {
    return (
      <p className="text-sm text-zinc-500">
        Initialize the launchpad above before creating coins.
      </p>
    );
  }

  return (
    <div id="launch" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Launch a token
          </h2>
          <p className="text-sm text-zinc-400">
            Costs{" "}
            <span className="font-medium text-zinc-200">{LAUNCH_FEE_SOL} SOL</span>{" "}
            (devnet). Supply is 1B tokens with 6 decimals, bonded on-curve.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Astro Sloth"
          max={32}
        />
        <Field
          label="Symbol"
          value={symbol}
          onChange={setSymbol}
          placeholder="ASLTH"
          max={10}
        />
        <Field
          label="Metadata URI (optional)"
          value={uri}
          onChange={setUri}
          placeholder="ipfs://… or https://…"
          max={200}
        />
      </div>
      {err ? <p className="text-xs text-red-400">{err}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="w-full rounded-xl border border-white/15 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400 px-4 py-3 text-sm font-bold text-zinc-950 shadow-xl shadow-black/25 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Deploying…" : `Pay ${LAUNCH_FEE_SOL} SOL & launch`}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  max,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  max: number;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <input
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/25"
      />
    </label>
  );
}
