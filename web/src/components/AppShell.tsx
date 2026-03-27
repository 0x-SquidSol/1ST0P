"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

type NavItem = {
  label: string;
  href: string;
};

const CONTEXT_MAP: Array<{ match: RegExp; title: string; items: NavItem[] }> = [
  {
    match: /^\/(coin\/|traders|traders\/)/,
    title: "Trade",
    items: [
      { label: "Pulse", href: "/" },
      { label: "Watchlist", href: "/traders" },
      { label: "Recent Trades", href: "/traders" },
    ],
  },
  {
    match: /^\/(marketplace|marketplace\/)/,
    title: "Marketplace",
    items: [
      { label: "Discover", href: "/marketplace" },
      { label: "Providers", href: "/marketplace" },
      { label: "Projects", href: "/marketplace" },
    ],
  },
  {
    match: /^\/(launch|launch\/)/,
    title: "Launch",
    items: [
      { label: "Overview", href: "/launch" },
      { label: "Create", href: "/launch" },
      { label: "My Launches", href: "/launch" },
      { label: "Docs", href: "/launch" },
    ],
  },
];

function getContext(pathname: string) {
  return CONTEXT_MAP.find((c) => c.match.test(pathname));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const context = getContext(pathname);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {context ? (
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-3">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {context.title} Context
                </p>
                <nav className="space-y-1">
                  {context.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={`${context.title}-${item.label}`}
                        href={item.href}
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "border border-white/15 bg-zinc-800/80 text-zinc-100"
                            : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
            <section>{children}</section>
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="mt-10 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-zinc-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-zinc-100">1ST0P</p>
              <p className="text-zinc-500">
                Discovery, credibility, and execution on Solana.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-zinc-400">
              <Link href="/" className="hover:text-zinc-200">
                Docs
              </Link>
              <Link href="/" className="hover:text-zinc-200">
                Vision
              </Link>
              <a
                href="https://x.com/0xsquid_sol"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-200"
              >
                X
              </a>
              <Link href="/" className="hover:text-zinc-200">
                Status
              </Link>
            </div>
          </div>
          <p className="text-xs text-zinc-600">
            1ST0P is experimental software on Solana devnet. Override{" "}
            <code className="text-zinc-500">NEXT_PUBLIC_PROGRAM_ID</code> if you
            redeploy. Not financial advice.
          </p>
        </div>
      </footer>
    </>
  );
}
