"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function WalletSummary() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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

  if (!connected || !publicKey) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-300">
      <span>{balance === null ? "— SOL" : `${balance.toFixed(3)} SOL`}</span>
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
        className="rounded border border-white/10 px-1.5 py-0.5 text-zinc-300 hover:text-white"
      >
        {copied ? "Wallet copied" : "Copy wallet address"}
      </button>
    </div>
  );
}

