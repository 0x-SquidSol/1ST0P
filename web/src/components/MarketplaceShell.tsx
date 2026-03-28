"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";

import { MarketplaceDirectory } from "@/components/MarketplaceDirectory";
import { MarketplaceFaq } from "@/components/MarketplaceFaq";
import { MarketplaceHowItWorks } from "@/components/MarketplaceHowItWorks";
import { ProviderSampleCards } from "@/components/ProviderSampleCards";

type Panel = "search" | "how" | "profiles" | "faq";

const NAV: { panel: Panel; label: string }[] = [
  { panel: "search", label: "Service search" },
  { panel: "how", label: "How it works" },
  { panel: "profiles", label: "Sample profiles" },
  { panel: "faq", label: "FAQs" },
];

function panelFromParam(raw: string | null): Panel {
  if (raw === "how" || raw === "profiles" || raw === "faq") return raw;
  return "search";
}

function MarketplaceDirectoryFallback() {
  return (
    <section
      className="polish-surface-subtle space-y-4 rounded-2xl bg-zinc-950/38 p-4 sm:p-6"
      aria-hidden
    >
      <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-800/80" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-zinc-800/80"
          />
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-zinc-900/60"
          />
        ))}
      </div>
    </section>
  );
}

const HASH_TO_PANEL: Record<string, Panel> = {
  "how-it-works": "how",
  "sample-providers": "profiles",
};

function MarketplaceShellInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didHashMigrate = useRef(false);

  const panel = useMemo(
    () => panelFromParam(searchParams.get("tab")),
    [searchParams],
  );

  const selectPanel = useCallback(
    (next: Panel) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next === "search") {
        p.delete("tab");
      } else {
        p.set("tab", next);
      }
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (didHashMigrate.current) return;
    if (typeof window === "undefined") return;
    const h = window.location.hash.replace(/^#/, "");
    if (!h) return;
    const mapped = HASH_TO_PANEL[h];
    if (!mapped || searchParams.get("tab")) return;
    didHashMigrate.current = true;
    selectPanel(mapped);
  }, [searchParams, selectPanel]);

  return (
    <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:gap-0 lg:divide-x lg:divide-white/[0.08]">
      <nav
        className="shrink-0 lg:w-48 lg:pr-8 xl:w-52"
        aria-label="Marketplace sections"
      >
        <ul
          role="tablist"
          className="flex flex-row gap-1 overflow-x-auto border-b border-white/[0.08] pb-3 [-webkit-overflow-scrolling:touch] lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0 lg:pt-1"
        >
          {NAV.map(({ panel: id, label }) => {
            const active = panel === id;
            return (
              <li key={id} className="shrink-0 lg:shrink" role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`marketplace-tab-${id}`}
                  aria-selected={active}
                  aria-controls="marketplace-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectPanel(id)}
                  className={`w-full whitespace-nowrap text-left text-sm transition-colors max-lg:-mb-px max-lg:border-b-2 max-lg:px-2 max-lg:py-2 lg:rounded-md lg:px-2.5 lg:py-2.5 ${
                    active
                      ? "max-lg:border-zinc-400 text-zinc-100 lg:bg-zinc-900/55 lg:ring-1 lg:ring-white/[0.08]"
                      : "max-lg:border-transparent text-zinc-500 hover:text-zinc-300 lg:hover:bg-zinc-900/25"
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        id="marketplace-panel"
        className="min-w-0 flex-1 lg:pl-8"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`marketplace-tab-${panel}`}
      >
        {panel === "search" && (
          <Suspense fallback={<MarketplaceDirectoryFallback />}>
            <MarketplaceDirectory embedded />
          </Suspense>
        )}
        {panel === "how" && <MarketplaceHowItWorks />}
        {panel === "profiles" && <ProviderSampleCards />}
        {panel === "faq" && <MarketplaceFaq />}
      </div>
    </div>
  );
}

export function MarketplaceShell() {
  return (
    <Suspense
      fallback={
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
          <div className="h-40 shrink-0 animate-pulse rounded-lg bg-zinc-900/40 lg:h-auto lg:w-48" />
          <div className="min-h-[200px] flex-1 animate-pulse rounded-2xl bg-zinc-900/30" />
        </div>
      }
    >
      <MarketplaceShellInner />
    </Suspense>
  );
}
