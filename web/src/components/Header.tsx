"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchModal } from "@/components/SearchModal";
import { WalletSummary } from "@/components/WalletSummary";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [walletUiReady, setWalletUiReady] = useState(false);

  useEffect(() => {
    setWalletUiReady(true);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Launch", href: "/launch" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Trade", href: "/traders" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        <div className="min-w-0 shrink-0">
          <Link href="/" className="group flex items-center gap-2">
            <span className="brand-sign h-9 w-9 shrink-0 sm:h-10 sm:w-10">
              <span className="brand-sign-text text-[10px] font-black">1ST0P</span>
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-bold tracking-wide text-zinc-100 sm:text-sm">
                1ST0P
              </div>
              <div className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:block">
                devnet launchpad
              </div>
            </div>
          </Link>
        </div>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 text-sm sm:flex md:gap-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-2 transition ${
                  active
                    ? "bg-zinc-800/70 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="shrink-0 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300 transition hover:text-zinc-100"
          >
            Search
          </button>
        </nav>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="shrink-0 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-300 transition hover:text-zinc-100 sm:hidden"
        >
          Search
        </button>
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <WalletSummary />
          {walletUiReady ? (
            <WalletMultiButton className="wallet-btn" />
          ) : (
            <div
              className="wallet-btn h-10 min-w-[120px] rounded-xl border border-white/16 bg-zinc-900/90 sm:min-w-[148px]"
              aria-hidden
            />
          )}
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
