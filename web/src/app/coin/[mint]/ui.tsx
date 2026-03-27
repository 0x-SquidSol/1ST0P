"use client";

import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { StateError, StateLoading } from "@/components/StateCards";
import { TradePanel } from "@/components/TradePanel";
import {
  fetchBondingCurveState,
  fetchGlobalConfigState,
  type BondingCurveState,
} from "@/lib/accounts";
import { bondingCurvePda } from "@/lib/pdas";
import { realSolHeldByAccount } from "@/lib/solana-helpers";

export function CoinDetail({ mintStr }: { mintStr: string }) {
  const { connection } = useConnection();
  const [curve, setCurve] = useState<BondingCurveState | null>(null);
  const [bad, setBad] = useState(false);
  const [realSol, setRealSol] = useState<bigint | null>(null);
  const [feeBps, setFeeBps] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mint = new PublicKey(mintStr);
        const curvePda = bondingCurvePda(mint);
        const [c, g, rs] = await Promise.all([
          fetchBondingCurveState(connection, mint),
          fetchGlobalConfigState(connection),
          realSolHeldByAccount(connection, curvePda).catch(() => BigInt(0)),
        ]);
        if (cancelled) return;
        if (!c) setBad(true);
        else setCurve(c);
        setFeeBps(g?.feeBps ?? null);
        setRealSol(rs);
      } catch {
        if (!cancelled) setBad(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, mintStr]);

  if (bad) {
    return (
      <StateError
        title="Coin Not Found"
        description="No bonding-curve account was found for this mint on the current program."
      />
    );
  }

  if (!curve) {
    return (
      <StateLoading
        title="Loading Coin Orbit"
        description="Fetching curve data, fee settings, and live SOL state."
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex text-sm text-zinc-500 hover:text-zinc-100"
      >
        ← Back to pulse
      </Link>
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-4 lg:col-span-3">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/50 p-5 sm:p-6 md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(242,243,245,0.20),rgba(75,80,88,0.00)_65%)] blur-2xl" />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{curve.name}</h1>
                <p className="text-zinc-300">${curve.symbol}</p>
              </div>
              <span className="shrink-0 self-start rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1 text-xs font-medium text-zinc-300 sm:self-auto">
                bonding curve
              </span>
            </div>
            <p className="mt-4 font-mono text-xs text-zinc-500 break-all">
              {curve.mint.toBase58()}
            </p>
            {curve.uri?.trim() ? (
              <a
                href={curve.uri.trim()}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white/50"
              >
                Metadata URI
              </a>
            ) : null}
            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                  SOL in curve
                </dt>
                <dd className="mt-1 font-mono text-sm text-zinc-200">
                  {realSol === null ? "—" : formatSol(realSol)}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Fee
                </dt>
                <dd className="mt-1 font-mono text-sm text-zinc-200">
                  {feeBps === null ? "—" : `${(feeBps / 100).toFixed(2)}%`}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Virtual SOL
                </dt>
                <dd className="mt-1 font-mono text-sm text-zinc-200">30.00</dd>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Creator
                </dt>
                <dd className="mt-1 font-mono text-xs text-zinc-300 break-all">
                  {curve.creator.toBase58()}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">
                  Tokens left in curve (raw)
                </dt>
                <dd className="mt-1 font-mono text-sm text-zinc-200">
                  {curve.tokenReserve.toString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="lg:col-span-2">
          <TradePanel mintStr={mintStr} initialCurve={curve} />
        </div>
      </div>
    </div>
  );
}

function formatSol(lamports: bigint): string {
  const sol = Number(lamports) / 1_000_000_000;
  return sol.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
