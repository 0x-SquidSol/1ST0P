"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderDiscoveryCard } from "@/components/ProviderDiscoveryCard";
import { allSampleDiscoveryCards } from "@/lib/discovery-cards";
import { listPublicProviders } from "@/lib/mock-providers";
import {
  MARKETPLACE_REVIEWS_STORAGE_KEY,
  MARKETPLACE_REVIEWS_UPDATED_EVENT,
} from "@/lib/marketplace-reviews";

export function ProviderSampleCards({ compact = false }: { compact?: boolean }) {
  const providers = listPublicProviders();
  const cards = allSampleDiscoveryCards(providers);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MARKETPLACE_REVIEWS_STORAGE_KEY) setVersion((v) => v + 1);
    };
    const onCustom = () => setVersion((v) => v + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    };
  }, []);

  if (compact) {
    return (
      <section
        id="sample-providers"
        className="polish-surface-subtle max-w-full min-w-0 scroll-mt-24 rounded-2xl bg-zinc-950/38 p-3 sm:p-4"
      >
        <div className="min-w-0 border-b border-white/[0.06] pb-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Providers
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-zinc-100">
            Sample listings
          </h2>
          <p className="mt-1 text-[10px] leading-snug text-zinc-600">
            One card per service offered — mock data until applications ship.
          </p>
        </div>
        <ul className="mt-3 flex min-w-0 flex-col gap-2">
          {cards.map((card) => (
            <li key={`${card.providerSlug}::${card.serviceName}`}>
              <ProviderDiscoveryCard
                card={card}
                refreshVersion={version}
                variant="sampleCompact"
              />
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-white/[0.06] pt-3">
          <Link
            href="/marketplace?tab=search"
            className="text-[11px] font-medium text-zinc-400 underline decoration-white/20 underline-offset-4 transition hover:text-zinc-200"
          >
            Find providers in Service search →
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section
      id="sample-providers"
      className="polish-surface-subtle max-w-full min-w-0 scroll-mt-24 space-y-4 rounded-3xl bg-zinc-950/38 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Providers
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-zinc-100 sm:text-xl">
            Sample listings
          </h2>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-right">
          Each card is one service from an approved provider. The same team can
          appear more than once if they list multiple services.
        </p>
      </div>
      <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={`${card.providerSlug}::${card.serviceName}`}>
            <ProviderDiscoveryCard
              card={card}
              refreshVersion={version}
              variant="sample"
            />
          </li>
        ))}
      </ul>
      <p className="text-center sm:text-left">
        <Link
          href="/marketplace?tab=search"
          className="text-sm font-medium text-zinc-400 underline decoration-white/20 underline-offset-4 transition hover:text-zinc-200"
        >
          Find providers in Service search →
        </Link>
      </p>
    </section>
  );
}
