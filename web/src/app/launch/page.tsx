"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { InitializeLaunchpad } from "@/components/InitializeLaunchpad";
import { LaunchCoin } from "@/components/LaunchCoin";
import { fetchGlobalConfigState } from "@/lib/accounts";

export default function LaunchPage() {
  const { connection } = useConnection();
  const [globalReady, setGlobalReady] = useState<boolean | null>(null);

  const refreshGlobal = useCallback(async () => {
    const g = await fetchGlobalConfigState(connection);
    setGlobalReady(g !== null);
  }, [connection]);

  useEffect(() => {
    void refreshGlobal();
  }, [refreshGlobal]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/50 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Launch Console
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Launch</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Create and configure your token launch with the same streamlined, clean
          flow used across 1ST0P.
        </p>
      </section>
      {globalReady === false ? (
        <InitializeLaunchpad onInitialized={() => void refreshGlobal()} />
      ) : null}
      <LaunchCoin onCreated={() => {}} />
    </div>
  );
}
