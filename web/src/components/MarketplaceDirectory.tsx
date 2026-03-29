"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FilterPills, SearchInput } from "@/components/SearchPrimitives";
import {
  MARKETPLACE_SERVICES,
  serviceNameToSlug,
  type ServiceGroup,
} from "@/lib/marketplace-services";
import { listPublicProviders } from "@/lib/mock-providers";
import {
  formatReputationLine,
  MARKETPLACE_REVIEWS_STORAGE_KEY,
  MARKETPLACE_REVIEWS_UPDATED_EVENT,
  reputationForProviderSlug,
} from "@/lib/marketplace-reviews";
import { type ProviderProfile, cardRateSummary } from "@/lib/provider-profile";

type Scope = "All" | ServiceGroup;

function providerSearchBlob(p: ProviderProfile): string {
  const fromOfferings = p.offerings.flatMap((o) => [
    o.serviceName,
    o.rateSummary,
    ...o.tags,
  ]);
  return [p.displayName, p.headline, cardRateSummary(p), ...fromOfferings]
    .join(" ")
    .toLowerCase();
}

function primaryServiceForQuery(p: ProviderProfile, normalized: string): string {
  const q = normalized.trim();
  const names = p.offerings.map((o) => o.serviceName);
  if (!q) return names[0] ?? "Services";
  const hit = names.find((s) => s.toLowerCase().includes(q));
  return hit ?? names[0] ?? "Services";
}

/** One line under the name: service · merged reputation line */
function providerPreviewSubline(p: ProviderProfile, normalized: string): string {
  const svc = primaryServiceForQuery(p, normalized);
  const rep = reputationForProviderSlug(p.slug, {
    listingRating: p.listingRating,
    reviewCount: p.reviewCount,
  });
  return `${svc} · ${formatReputationLine(rep)}`;
}

export function MarketplaceDirectory({ embedded = false }: { embedded?: boolean }) {
  const params = useSearchParams();
  const searchFieldId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const seedQuery = params.get("service") ?? "";
  const [query, setQuery] = useState(seedQuery);
  const [scope, setScope] = useState<Scope>("All");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [reviewEpoch, setReviewEpoch] = useState(0);
  const normalized = query.trim().toLowerCase();

  const filteredServices = useMemo(
    () =>
      MARKETPLACE_SERVICES.filter((s) => (scope === "All" ? true : s.group === scope)).filter(
        (s) => (normalized ? s.name.toLowerCase().includes(normalized) : true),
      ),
    [normalized, scope],
  );

  const suggestionServices = useMemo(() => {
    if (normalized.length < 1) return [];
    return MARKETPLACE_SERVICES.filter((s) =>
      s.name.toLowerCase().includes(normalized),
    ).slice(0, 8);
  }, [normalized]);

  const suggestionProviders = useMemo(() => {
    if (normalized.length < 1) return [];
    void reviewEpoch;
    const approved = listPublicProviders();
    return approved
      .filter((p) => providerSearchBlob(p).includes(normalized))
      .slice(0, 8);
  }, [normalized, reviewEpoch]);

  const showPanel =
    suggestOpen &&
    normalized.length >= 1 &&
    (suggestionServices.length > 0 || suggestionProviders.length > 0);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el || !(e.target instanceof Node)) return;
      if (!el.contains(e.target)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MARKETPLACE_REVIEWS_STORAGE_KEY) setReviewEpoch((n) => n + 1);
    };
    const onCustom = () => setReviewEpoch((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, onCustom);
    };
  }, []);

  const onInputChange = useCallback((v: string) => {
    setQuery(v);
    setSuggestOpen(true);
  }, []);

  return (
    <section
      className={`polish-surface-subtle max-w-full min-w-0 space-y-4 bg-zinc-950/38 p-4 sm:p-6 ${
        embedded ? "rounded-2xl" : "rounded-3xl"
      }`}
    >
      {!embedded && (
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Service Search
        </p>
      )}
      {embedded && (
        <h2 className="text-sm font-medium text-zinc-200">Browse services</h2>
      )}
      <p className="text-xs leading-relaxed text-zinc-500">
        Search surfaces matching services and approved providers. Pick a service row
        to see everyone who offers it, or open a provider line for their full
        profile.
      </p>
      <div ref={wrapRef} className="relative">
        <label htmlFor={searchFieldId} className="sr-only">
          Search marketplace services and providers
        </label>
        <SearchInput
          id={searchFieldId}
          value={query}
          onChange={onInputChange}
          onFocus={() => setSuggestOpen(true)}
          placeholder="Type a service or provider name…"
        />
        {showPanel ? (
          <div
            className="polish-surface-subtle absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(70vh,22rem)] overflow-y-auto rounded-xl border border-white/12 bg-zinc-950/95 p-2 shadow-xl backdrop-blur-md [-webkit-overflow-scrolling:touch]"
            role="region"
            aria-label="Search matches"
          >
            {suggestionServices.length > 0 ? (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  Services
                </p>
                <ul className="space-y-0.5">
                  {suggestionServices.map((s) => (
                    <li key={s.name}>
                      <Link
                        href={`/marketplace/browse/${serviceNameToSlug(s.name)}`}
                        className="block rounded-lg px-2 py-2 text-sm text-zinc-200 hover:bg-zinc-900/80"
                        onClick={() => setSuggestOpen(false)}
                      >
                        {s.name}
                        <span className="mt-0.5 block text-[11px] text-zinc-500">
                          View providers →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {suggestionProviders.length > 0 ? (
              <div>
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                  Providers
                </p>
                <ul className="space-y-0.5">
                  {suggestionProviders.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/marketplace/providers/${p.slug}`}
                        className="block rounded-lg px-2 py-2 text-sm text-zinc-200 hover:bg-zinc-900/80"
                        onClick={() => setSuggestOpen(false)}
                      >
                        <span className="font-medium text-zinc-100">
                          {p.displayName}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                          {providerPreviewSubline(p, normalized)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div role="group" aria-label="Service category filters">
        <FilterPills
          value={scope}
          onChange={setScope}
          options={["All", "Development", "Growth", "Community"]}
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {filteredServices.length === 0 ? (
          <p className="text-xs text-zinc-500">No matching service categories.</p>
        ) : (
          filteredServices.map((s) => (
            <Link
              key={s.name}
              href={`/marketplace/browse/${serviceNameToSlug(s.name)}`}
              className="rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-900/90"
            >
              <span className="font-medium">{s.name}</span>
              <span className="mt-0.5 block text-[11px] text-zinc-500">
                Browse providers →
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
