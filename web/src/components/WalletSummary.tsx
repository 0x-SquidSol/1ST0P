"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function WalletSummary() {
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

  if (!mounted || !connected || !publicKey) return null;

  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/60 px-1.5 py-1 text-[11px] text-zinc-300 sm:flex-nowrap sm:gap-2 sm:px-2 sm:py-1">
      <span className="tabular-nums">
        {balance === null ? "— SOL" : `${balance.toFixed(3)} SOL`}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(publicKey.toBase58());
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            setCopied(false);
          }
        }}
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

