"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatReputationLine,
  MARKETPLACE_REVIEWS_STORAGE_KEY,
  MARKETPLACE_REVIEWS_UPDATED_EVENT,
  reputationForProviderSlug,
} from "@/lib/marketplace-reviews";
import { type ProviderProfile, cardRateSummary } from "@/lib/provider-profile";

type Props = {
  providers: ProviderProfile[];
};

export function BrowseProvidersGrid({ providers }: Props) {
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

  function trustLine(p: ProviderProfile): string {
    void version;
    return formatReputationLine(
      reputationForProviderSlug(p.slug, {
        listingRating: p.listingRating,
        reviewCount: p.reviewCount,
      }),
    );
  }

  return (
    <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
      {providers.map((p) => (
        <li key={p.slug}>
          <Link
            href={`/marketplace/providers/${p.slug}`}
            className="polish-card-interactive flex min-h-[132px] flex-col rounded-2xl border border-white/10 bg-zinc-950/45 p-4 sm:p-5"
          >
            <span className="text-base font-semibold text-zinc-100">
              {p.displayName}
            </span>
            <span className="mt-1 text-xs text-zinc-500">{trustLine(p)}</span>
            <span className="mt-2 line-clamp-2 text-sm text-zinc-400">
              {p.headline}
            </span>
            <span className="mt-auto pt-3 text-xs font-medium text-zinc-500">
              {cardRateSummary(p)}
            </span>
            <span className="mt-2 text-xs text-zinc-600">Full profile →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
