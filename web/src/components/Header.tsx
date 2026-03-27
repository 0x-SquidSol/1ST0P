"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Launch", href: "/launch" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Traders", href: "/traders" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="brand-sign h-10 w-10">
            <span className="brand-sign-text text-[10px] font-black">1ST0P</span>
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wide text-zinc-100">
              1ST0P
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              devnet launchpad
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 text-sm sm:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 transition ${
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
            className="ml-2 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300 transition hover:text-zinc-100"
          >
            Search
          </button>
        </nav>
        <WalletMultiButton className="wallet-btn" />
      </div>
    </header>
  );
}
