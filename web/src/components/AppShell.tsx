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
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-3 py-6 break-words sm:px-4 sm:py-8"
      >
        {context ? (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
            <aside
              className="min-w-0 max-w-full lg:sticky lg:top-24 lg:h-fit"
              aria-label={`${context.title} section`}
            >
              <div className="polish-inset-panel max-w-full rounded-2xl bg-zinc-950/50 p-3">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {context.title} Context
                </p>
                <nav
                  className="flex flex-col gap-1 lg:flex-col"
                  aria-label={`${context.title} shortcuts`}
                >
                  {context.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={`${context.title}-${item.label}`}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-lg px-3 py-2 text-sm transition lg:w-full ${
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
            <section className="min-w-0 max-w-full">{children}</section>
          </div>
        ) : (
          <div className="min-w-0 max-w-full">{children}</div>
        )}
      </main>
      <footer
        className="polish-footer mt-10 border-t border-white/10"
        aria-label="Site footer"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-8 text-sm text-zinc-400 sm:px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-base font-semibold text-zinc-100">1ST0P</p>
              <p className="text-zinc-500">
                Discovery, credibility, and execution on Solana.
              </p>
            </div>
            <nav
              className="flex flex-wrap items-center justify-center gap-3 text-zinc-400 sm:justify-end sm:gap-4"
              aria-label="Footer navigation"
            >
              <Link href="/docs" className="hover:text-zinc-200">
                Docs
              </Link>
              <Link href="/vision" className="hover:text-zinc-200">
                Vision
              </Link>
              <Link href="/contact" className="hover:text-zinc-200">
                Contact
              </Link>
              <a
                href="https://x.com/0xsquid_sol"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-200"
                aria-label="1ST0P on X (opens in new tab)"
              >
                X
              </a>
              <Link href="/status" className="hover:text-zinc-200">
                Status
              </Link>
            </nav>
          </div>
          <p className="text-xs text-zinc-500">
            1ST0P is experimental software on Solana devnet. Override{" "}
            <code className="text-zinc-500">NEXT_PUBLIC_PROGRAM_ID</code> if you
            redeploy. Not financial advice.
          </p>
        </div>
      </footer>
    </>
  );
}
