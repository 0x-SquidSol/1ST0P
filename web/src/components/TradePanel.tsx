"use client";

import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchBondingCurveState,
  fetchGlobalConfigState,
  type BondingCurveState,
} from "@/lib/accounts";
import {
  DEFAULT_SLIPPAGE_BPS,
  TOKEN_DECIMALS,
  VIRTUAL_SOL_LAMPORTS,
} from "@/lib/constants";
import { feeFromAmount, quoteBuy, quoteSell } from "@/lib/curve-math";
import { bondingCurvePda, globalConfigPda } from "@/lib/pdas";
import { programFor } from "@/lib/program";
import { realSolHeldByAccount } from "@/lib/solana-helpers";

function toRawTokens(amount: number): bigint {
  const s = amount.toFixed(TOKEN_DECIMALS);
  const [a, b = ""] = s.split(".");
  const frac = (b + "0".repeat(TOKEN_DECIMALS)).slice(0, TOKEN_DECIMALS);
  return BigInt(a + frac);
}

function fromRawTokens(raw: bigint): string {
  if (raw === BigInt(0)) return "0";
  const base = BigInt(10 ** TOKEN_DECIMALS);
  const ip = raw / base;
  const fp = raw % base;
  if (fp === BigInt(0)) return ip.toString();
  const fs = fp.toString().padStart(TOKEN_DECIMALS, "0").replace(/0+$/, "");
  return `${ip.toString()}.${fs}`;
}

export function TradePanel({
  mintStr,
  initialCurve,
}: {
  mintStr: string;
  initialCurve: BondingCurveState;
}) {
  const mint = useMemo(() => new PublicKey(mintStr), [mintStr]);
  const { connection } = useConnection();
  const wallet = useWallet();

  const [curve, setCurve] = useState(initialCurve);
  const [feeBps, setFeeBps] = useState(100);
  const [realSol, setRealSol] = useState(BigInt(0));
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [solIn, setSolIn] = useState("0.02");
  const [tokenIn, setTokenIn] = useState("1000");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const curvePda = useMemo(() => bondingCurvePda(mint), [mint]);

  const refresh = useCallback(async () => {
    const [c, g, rs] = await Promise.all([
      fetchBondingCurveState(connection, mint),
      fetchGlobalConfigState(connection),
      realSolHeldByAccount(connection, curvePda).catch(() => BigInt(0)),
    ]);
    if (c) setCurve(c);
    if (g) setFeeBps(g.feeBps);
    setRealSol(rs);
  }, [connection, curvePda, mint]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const quoteBuySide = useMemo(() => {
    try {
      const lamports = BigInt(
        Math.floor(Number(solIn || "0") * LAMPORTS_PER_SOL),
      );
      if (lamports <= BigInt(0)) return null;
      const fee = feeFromAmount(lamports, feeBps);
      const toCurve = lamports - fee;
      return quoteBuy(
        VIRTUAL_SOL_LAMPORTS,
        realSol,
        curve.tokenReserve,
        toCurve,
      );
    } catch {
      return null;
    }
  }, [curve.tokenReserve, feeBps, realSol, solIn]);

  const quoteSellSide = useMemo(() => {
    try {
      const raw = toRawTokens(Number(tokenIn || "0"));
      if (raw <= BigInt(0)) return null;
      const { solOutBeforeFee } = quoteSell(
        VIRTUAL_SOL_LAMPORTS,
        realSol,
        curve.tokenReserve,
        raw,
      );
      const fee = feeFromAmount(solOutBeforeFee, feeBps);
      const userSol = solOutBeforeFee - fee;
      return { solOutBeforeFee, userSol };
    } catch {
      return null;
    }
  }, [curve.tokenReserve, feeBps, realSol, tokenIn]);

  const execBuy = useCallback(async () => {
    setErr(null);
    if (!wallet.publicKey || !wallet.signTransaction) {
      setErr("Connect wallet.");
      return;
    }
    const g = await fetchGlobalConfigState(connection);
    if (!g) {
      setErr("Global config missing.");
      return;
    }
    const lamports = Math.floor(Number(solIn || "0") * LAMPORTS_PER_SOL);
    if (!(lamports > 0)) {
      setErr("Enter SOL amount.");
      return;
    }
    if (!quoteBuySide) {
      setErr("No quote.");
      return;
    }
    const minOut =
      (quoteBuySide.tokensOut * BigInt(10_000 - DEFAULT_SLIPPAGE_BPS)) /
      BigInt(10_000);

    const curveAccount = bondingCurvePda(mint);
    const curveAta = getAssociatedTokenAddressSync(mint, curveAccount, true);
    const userAta = getAssociatedTokenAddressSync(
      mint,
      wallet.publicKey,
      false,
    );

    setBusy(true);
    try {
      const program = programFor(connection, wallet.wallet);
      const sig = await program.methods
        .buy(new BN(lamports), new BN(minOut.toString()))
        .accounts({
          user: wallet.publicKey,
          globalConfig: globalConfigPda(),
          treasury: g.treasury,
          bondingCurve: curveAccount,
          mint,
          curveTokenAccount: curveAta,
          userTokenAccount: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            userAta,
            wallet.publicKey,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        ])
        .rpc();
      await connection.confirmTransaction(sig, "confirmed");
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Buy failed");
    } finally {
      setBusy(false);
    }
  }, [connection, mint, quoteBuySide, refresh, solIn, wallet]);

  const execSell = useCallback(async () => {
    setErr(null);
    if (!wallet.publicKey || !wallet.signTransaction) {
      setErr("Connect wallet.");
      return;
    }
    const g = await fetchGlobalConfigState(connection);
    if (!g) {
      setErr("Global config missing.");
      return;
    }
    const raw = toRawTokens(Number(tokenIn || "0"));
    if (raw <= BigInt(0)) {
      setErr("Enter token amount.");
      return;
    }
    if (!quoteSellSide) {
      setErr("No quote.");
      return;
    }
    const minSol =
      (quoteSellSide.userSol * BigInt(10_000 - DEFAULT_SLIPPAGE_BPS)) /
      BigInt(10_000);

    const curveAccount = bondingCurvePda(mint);
    const curveAta = getAssociatedTokenAddressSync(mint, curveAccount, true);
    const userAta = getAssociatedTokenAddressSync(
      mint,
      wallet.publicKey,
      false,
    );

    setBusy(true);
    try {
      const program = programFor(connection, wallet.wallet);
      const sig = await program.methods
        .sell(new BN(raw.toString()), new BN(minSol.toString()))
        .accounts({
          user: wallet.publicKey,
          globalConfig: globalConfigPda(),
          treasury: g.treasury,
          bondingCurve: curveAccount,
          mint,
          curveTokenAccount: curveAta,
          userTokenAccount: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions([
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            userAta,
            wallet.publicKey,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        ])
        .rpc();
      await connection.confirmTransaction(sig, "confirmed");
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sell failed");
    } finally {
      setBusy(false);
    }
  }, [
    connection,
    mint,
    quoteSellSide,
    refresh,
    tokenIn,
    wallet,
  ]);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 shadow-inner shadow-black/40">
      <div className="flex gap-2 rounded-xl bg-zinc-900/80 p-1">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            side === "buy"
              ? "border border-white/15 bg-gradient-to-r from-zinc-200 to-zinc-400 text-zinc-950 shadow-sm shadow-black/20"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            side === "sell"
              ? "border border-white/15 bg-gradient-to-r from-zinc-200 to-zinc-400 text-zinc-950 shadow-sm shadow-black/20"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Sell
        </button>
      </div>

      {side === "buy" ? (
        <div className="mt-5 space-y-3">
          <label className="block text-xs text-zinc-500">
            SOL in
            <input
              value={solIn}
              onChange={(e) => setSolIn(e.target.value)}
              type="number"
              step="any"
              min="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Est. tokens (after 1% fee on input)</span>
              <span className="font-mono text-zinc-200">
                {quoteBuySide
                  ? fromRawTokens(quoteBuySide.tokensOut)
                  : "—"}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
              <span>Slippage tolerance</span>
              <span>~{DEFAULT_SLIPPAGE_BPS / 100}%</span>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void execBuy()}
            className="w-full rounded-xl border border-white/15 bg-gradient-to-r from-zinc-200 to-zinc-400 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-black/25 disabled:opacity-50"
          >
            {busy ? "Confirm in wallet…" : "Buy on curve"}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <label className="block text-xs text-zinc-500">
            Tokens in
            <input
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              type="number"
              step="any"
              min="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Est. SOL out (after 1% fee on output)</span>
              <span className="font-mono text-zinc-200">
                {quoteSellSide
                  ? (
                      Number(quoteSellSide.userSol) / LAMPORTS_PER_SOL
                    ).toLocaleString(undefined, { maximumFractionDigits: 6 })
                  : "—"}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void execSell()}
            className="w-full rounded-xl border border-white/15 bg-gradient-to-r from-zinc-200 to-zinc-400 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-black/25 disabled:opacity-50"
          >
            {busy ? "Confirm in wallet…" : "Sell into curve"}
          </button>
        </div>
      )}

      {err ? <p className="mt-3 text-xs text-red-400">{err}</p> : null}
    </div>
  );
}
