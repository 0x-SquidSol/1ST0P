"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

function truncatePk(pk: string, start = 6, end = 4) {
  if (pk.length <= start + end + 1) return pk;
  return `${pk.slice(0, start)}…${pk.slice(-end)}`;
}

export function WalletSummary({
  variant = "header",
}: {
  variant?: "header" | "menu";
}) {
  const [mounted, setMounted] = useState(false);
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!publicKey) {
      setBalance(null);
      return;
    }
    void (async () => {
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setBalance(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  if (!mounted) return null;

  if (variant === "menu" && (!connected || !publicKey)) {
    return (
      <div className="w-full rounded-xl border border-dashed border-white/12 bg-zinc-900/30 px-3 py-2.5 text-center text-xs leading-snug text-zinc-500">
        Connect with the wallet button above to see your devnet balance and copy
        your address.
      </div>
    );
  }

  if (!connected || !publicKey) return null;

  const pk = publicKey.toBase58();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pk);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  if (variant === "menu") {
    return (
      <div className="w-full rounded-xl border border-white/12 bg-zinc-900/55 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Devnet balance
        </p>
        <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-zinc-100">
          {balance === null ? "— SOL" : `${balance.toFixed(3)} SOL`}
        </p>
        <p
          className="mt-2 font-mono text-[11px] leading-snug text-zinc-500"
          title={pk}
        >
          {truncatePk(pk)}
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="mt-3 w-full rounded-lg border border-white/14 bg-zinc-800/80 py-2 text-sm font-medium text-zinc-100 transition hover:border-white/25 hover:bg-zinc-800"
        >
          {copied ? "Address copied" : "Copy wallet address"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/60 px-1.5 py-1 text-[11px] text-zinc-300 sm:flex-nowrap sm:gap-2 sm:px-2 sm:py-1">
      <span className="tabular-nums">
        {balance === null ? "— SOL" : `${balance.toFixed(3)} SOL`}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-zinc-300 hover:text-white sm:px-2"
        aria-label={copied ? "Address copied" : "Copy wallet address"}
      >
        <span className="sm:hidden">{copied ? "Copied" : "Copy"}</span>
        <span className="hidden sm:inline">
          {copied ? "Wallet copied" : "Copy wallet address"}
        </span>
      </button>
    </div>
  );
}
