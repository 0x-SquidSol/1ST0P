"use client";

import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { fetchAllBondingCurves } from "@/lib/accounts";
import { FilterPills, SearchInput } from "@/components/SearchPrimitives";

type Scope = "All" | "Name/Ticker" | "Contract Address";

type Project = {
  mint: string;
  name: string;
  symbol: string;
};

export function TradeProjectSearch() {
  const { connection } = useConnection();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("All");
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const all = await fetchAllBondingCurves(connection);
        if (cancelled) return;
        setRows(
          all.map(({ curve }) => ({
            mint: curve.mint.toBase58(),
            name: curve.name,
            symbol: curve.symbol,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!normalized) return true;
      if (scope === "Contract Address") return r.mint.toLowerCase().includes(normalized);
      if (scope === "Name/Ticker") {
        return (
          r.name.toLowerCase().includes(normalized) ||
          r.symbol.toLowerCase().includes(normalized)
        );
      }
      return (
        r.mint.toLowerCase().includes(normalized) ||
        r.name.toLowerCase().includes(normalized) ||
        r.symbol.toLowerCase().includes(normalized)
      );
    });
  }, [normalized, rows, scope]);

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/35 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Project Search
      </p>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search launched project by CA, name, or ticker"
      />
      <FilterPills
        value={scope}
        onChange={setScope}
        options={["All", "Name/Ticker", "Contract Address"]}
      />
      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-zinc-500">Loading launched projects…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-zinc-500">No matching launched projects.</p>
        ) : (
          filtered.slice(0, 12).map((row) => (
            <Link
              key={row.mint}
              href={`/coin/${row.mint}`}
              className="block rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 hover:border-white/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span>
                  {row.name} <span className="text-zinc-400">${row.symbol}</span>
                </span>
                <span className="truncate font-mono text-xs text-zinc-500">
                  {row.mint}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

