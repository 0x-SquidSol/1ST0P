"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { InitializeLaunchpad } from "@/components/InitializeLaunchpad";
import { LaunchCoin } from "@/components/LaunchCoin";
import { PageHeader } from "@/components/PageHeader";
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
    <div className="space-y-8 sm:space-y-12">
      <section className="polish-surface-page rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Launch Console"
          title="Launch"
          description="This page will evolve into the application-first launch flow (apply → interview → launch plan → presale → official launch). For now, it hosts the devnet launchpad tooling."
        />
      </section>
      {globalReady === false ? (
        <InitializeLaunchpad onInitialized={() => void refreshGlobal()} />
      ) : null}
      <LaunchCoin onCreated={() => {}} />
    </div>
  );
}
