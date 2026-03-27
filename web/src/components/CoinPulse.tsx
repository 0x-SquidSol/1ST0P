"use client";

import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAllBondingCurves,
  type BondingCurveState,
} from "@/lib/accounts";

export function CoinPulse() {
  const { connection } = useConnection();
  const [rows, setRows] = useState<{ address: string; curve: BondingCurveState }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchAllBondingCurves(connection);
      setRows(
        all.map(({ address, curve }) => ({
          address: address.toBase58(),
          curve,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section id="pulse" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-50">Pulse</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/25 hover:bg-zinc-900/80 hover:text-zinc-100"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500">Scanning chain…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No launches yet — be the first on this program.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ curve }) => (
            <Link
              key={curve.mint.toBase58()}
              href={`/coin/${curve.mint.toBase58()}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 p-4 transition hover:border-white/25 hover:bg-zinc-950/55 hover:shadow-lg hover:shadow-black/30"
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(242,243,245,0.28),rgba(75,80,88,0.0)_65%)] blur-2xl transition group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-100">{curve.name}</div>
                  <div className="text-xs text-zinc-300">${curve.symbol}</div>
                </div>
                <span className="rounded-full border border-white/10 bg-zinc-900/70 px-2 py-0.5 text-[10px] text-zinc-400">
                  live
                </span>
              </div>
              <p className="relative mt-2 truncate text-xs text-zinc-500">
                {curve.mint.toBase58()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
