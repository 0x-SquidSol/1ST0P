"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SearchModal } from "@/components/SearchModal";
import { WalletSummary } from "@/components/WalletSummary";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Launch", href: "/launch" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Trade", href: "/traders" },
] as const;

const secondaryNav = [
  { label: "Docs", href: "/docs" },
  { label: "Vision", href: "/vision" },
  { label: "Contact", href: "/contact" },
  { label: "Status", href: "/status" },
] as const;

function navLinkClass(active: boolean) {
  return `block rounded-lg px-3 py-2.5 text-sm transition ${
    active
      ? "bg-zinc-800/80 text-zinc-100"
      : "text-zinc-300 hover:bg-zinc-900/80 hover:text-zinc-100"
  }`;
}

export function Header() {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletUiReady, setWalletUiReady] = useState(false);
  const [menuPortalReady, setMenuPortalReady] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setWalletUiReady(true);
  }, []);

  // Fetch username when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) {
      setUsername(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/profile/lookup?wallet=${publicKey.toBase58()}`,
        );
        if (!res.ok) { if (!cancelled) setUsername(null); return; }
        const data = (await res.json()) as { username: string };
        if (!cancelled) setUsername(data.username);
      } catch {
        if (!cancelled) setUsername(null);
      }
    })();
    return () => { cancelled = true; };
  }, [connected, publicKey]);

  useEffect(() => {
    setMenuPortalReady(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onWiden = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onWiden);
    return () => mq.removeEventListener("change", onWiden);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const openSearchFromMenu = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(true);
  }, []);

  return (
    <header
      className="polish-header sticky top-0 z-50 overflow-visible border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl"
      aria-label="Site header"
    >
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 overflow-visible py-2.5 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:gap-4 sm:px-4 sm:py-4">
        <div className="min-w-0 shrink-0">
          <Link
            href="/"
            className="group flex items-center gap-1.5 sm:gap-2"
            aria-label="1ST0P home"
          >
            <span className="brand-sign h-8 w-8 shrink-0 sm:h-10 sm:w-10">
              <span className="brand-sign-text text-[9px] font-black sm:text-[10px]">
                1ST0P
              </span>
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

        <nav
          className="hidden min-w-0 flex-1 items-center justify-end gap-1 text-sm sm:flex md:gap-2"
          aria-label="Primary navigation"
        >
          {primaryNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
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
            aria-expanded={searchOpen}
            aria-controls="global-search-dialog"
            aria-haspopup="dialog"
          >
            Search
          </button>
        </nav>

        <div className="relative z-[60] flex min-w-0 flex-1 basis-0 items-center justify-end gap-1 overflow-x-hidden sm:flex-none sm:basis-auto sm:gap-2 sm:overflow-x-visible">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/70 text-zinc-300 transition hover:text-zinc-100 sm:hidden"
            aria-label="Open search"
            aria-expanded={searchOpen}
            aria-controls="global-search-dialog"
            aria-haspopup="dialog"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/70 text-zinc-200 transition hover:bg-zinc-800/80 sm:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label="Open menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <div className="relative flex min-w-0 max-w-full items-center gap-1 overflow-visible sm:max-w-none sm:gap-2">
            {username && (
              <Link
                href={`/profile/${username}`}
                className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-800/80 hover:text-white sm:flex"
              >
                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {username}
              </Link>
            )}
            <div className="hidden min-w-0 sm:flex sm:items-center">
              <WalletSummary />
            </div>
            {walletUiReady ? (
              <div className="wallet-multi-wrap min-w-0 max-w-[min(100%,10.5rem)] sm:max-w-none">
                <WalletMultiButton className="wallet-btn wallet-btn-header" />
              </div>
            ) : (
              <div
                className="wallet-btn wallet-btn-header h-9 min-w-[7.25rem] rounded-xl border border-white/16 bg-zinc-900/90 sm:h-10 sm:min-w-[148px]"
                role="status"
                aria-live="polite"
                aria-label="Loading wallet controls"
              />
            )}
          </div>
        </div>
      </div>

      {menuOpen && menuPortalReady
        ? createPortal(
            <div
              className="fixed inset-0 z-[160] sm:hidden"
              id="mobile-nav-panel"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="polish-modal absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-white/10 bg-zinc-950 pt-[env(safe-area-inset-top)] shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Menu
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100"
                  >
                    Close
                  </button>
                </div>
                <div className="border-b border-white/10 px-3 pb-3 pt-1">
                  {username && (
                    <Link
                      href={`/profile/${username}`}
                      onClick={() => setMenuOpen(false)}
                      className="mb-2 flex items-center gap-2 rounded-lg bg-zinc-900/50 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800/80"
                    >
                      <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {username}
                    </Link>
                  )}
                  <WalletSummary variant="menu" />
                </div>
                <nav
                  className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
                  aria-label="Mobile primary navigation"
                >
                  <button
                    type="button"
                    onClick={openSearchFromMenu}
                    className="rounded-lg border border-white/12 bg-zinc-900/70 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800/80"
                  >
                    Search…
                  </button>
                  {primaryNav.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={navLinkClass(active)}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  {username && (
                    <Link
                      href={`/profile/${username}`}
                      className={navLinkClass(pathname.startsWith("/profile"))}
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  <p className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                    More
                  </p>
                  {secondaryNav.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={navLinkClass(active)}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
