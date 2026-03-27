"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function Header() {
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
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
          <a href="#launch" className="hover:text-zinc-100">
            Launch
          </a>
          <a href="#pulse" className="hover:text-zinc-100">
            Pulse
          </a>
          <span className="rounded-full border border-white/10 bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-300">
            1 SOL launch · 1% trade fee
          </span>
        </nav>
        <WalletMultiButton className="wallet-btn" />
      </div>
    </header>
  );
}
