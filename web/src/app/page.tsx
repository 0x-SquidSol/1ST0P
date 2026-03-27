"use client";

import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { CoinPulse } from "@/components/CoinPulse";
import { InitializeLaunchpad } from "@/components/InitializeLaunchpad";
import { LaunchCoin } from "@/components/LaunchCoin";
import { PageHeader } from "@/components/PageHeader";
import { fetchGlobalConfigState } from "@/lib/accounts";

const personaPaths = [
  {
    title: "Launch a Token",
    description:
      "Apply to launch on 1ST0P with a real team, real roadmap, and real accountability.",
    trust: "Manual review + formal interview + launch plan",
    href: "/launch",
    cta: "Apply to Launch",
    next: "Next: submit your team and project application",
  },
  {
    title: "Hire Services",
    description:
      "Hire across development, design, raids, moderation, and community ops with escrow protection.",
    trust: "Escrow custody + milestone/timeboxed releases",
    href: "/marketplace",
    cta: "View Services",
    next: "Next: browse approved providers and listings",
  },
  {
    title: "Offer Services",
    description:
      "Apply to list your services and build reputation through verified delivery and buyer feedback.",
    trust: "Manual approval + mandatory buyer reviews at closeout",
    href: "/marketplace",
    cta: "Apply as Provider",
    next: "Next: submit provider application for review",
  },
  {
    title: "Discover & Trade Projects",
    description:
      "Review project quality signals and market activity in one trade-focused workspace.",
    trust: "Verification context shown alongside project status",
    href: "/traders",
    cta: "View Projects",
    next: "Next: filter by presale/live status and credibility",
  },
];

export default function HomePage() {
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
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/50 p-10 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(184,191,201,0.16),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(62,67,76,0.35),transparent_45%)]" />
        <div className="relative max-w-2xl space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-zinc-800/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-zinc-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300" />
            1st0p devnet flight deck
          </p>
          <div className="brand-sign h-24 w-24">
            <span className="brand-sign-text text-xl font-black">1ST0P</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            1ST0P
          </h1>
          <p className="text-xl text-zinc-200">
            Your One Stop Shop To All Your Developer Needs
          </p>
          <p className="text-lg text-zinc-400">
            Permissionless Solana token launches for{" "}
            <span className="text-zinc-200">1 SOL</span>, with{" "}
            <span className="text-zinc-200">~1% fees</span> on buys and sells
            to your treasury.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
            <span className="rounded-xl bg-zinc-900/80 px-3 py-2">
              Constant-product curve + 30 SOL virtual depth
            </span>
            <span className="rounded-xl bg-zinc-900/80 px-3 py-2">
              1B supply · 6 decimals · SPL token
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <PageHeader
          label="Entry Paths"
          title="Choose your 1ST0P lane"
          description="Every lane is built around accountability, clear process, and discoverable execution."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {personaPaths.map((path) => (
            <div
              key={path.title}
              className="flex min-h-[210px] flex-col rounded-2xl border border-white/10 bg-zinc-950/40 p-6"
            >
              <h3 className="text-lg font-semibold text-zinc-100">{path.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{path.description}</p>
              <p className="mt-3 text-xs text-zinc-500">{path.trust}</p>
              <p className="mt-2 text-xs text-zinc-600">{path.next}</p>
              <Link
                href={path.href}
                className="mt-auto inline-flex w-fit rounded-lg border border-white/15 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:text-white"
              >
                {path.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950/35 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Trust Model
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            Launch teams go through manual review and formal interview before
            approval.
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            Service providers are manually approved before they appear in
            listings.
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            Buyer funds stay in escrow/treasury until completion rules are met,
            with mandatory closeout feedback.
          </div>
        </div>
      </section>

      {globalReady === false ? (
        <InitializeLaunchpad onInitialized={() => void refreshGlobal()} />
      ) : null}

      <div className="grid gap-10 rounded-3xl border border-white/10 bg-zinc-950/40 p-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <LaunchCoin onCreated={() => {}} />
        </div>
        <div className="lg:col-span-3">
          <CoinPulse />
        </div>
      </div>

    </div>
  );
}
