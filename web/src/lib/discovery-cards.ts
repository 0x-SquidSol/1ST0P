import type { ProviderProfile, ProviderServiceOffering } from "@/lib/provider-profile";
import { publicOfferings } from "@/lib/provider-profile";

/** One marketplace discovery row = one provider × one offered service (separate cards per service). */
export type DiscoveryCardStatic = {
  providerSlug: string;
  displayName: string;
  serviceName: string;
  listingRating?: number;
  reviewCount?: number;
};

function toCard(p: ProviderProfile, o: ProviderServiceOffering): DiscoveryCardStatic {
  return {
    providerSlug: p.slug,
    displayName: p.displayName,
    serviceName: o.serviceName,
    listingRating: o.listingRating ?? p.listingRating,
    reviewCount: o.reviewCount ?? p.reviewCount,
  };
}

/** Category page: one card per approved provider who lists this service (that offering’s stats). */
export function discoveryCardsForBrowse(
  providers: ProviderProfile[],
  serviceName: string,
): DiscoveryCardStatic[] {
  const out: DiscoveryCardStatic[] = [];
  for (const p of providers) {
    const o = publicOfferings(p.offerings).find((x) => x.serviceName === serviceName);
    if (o) out.push(toCard(p, o));
  }
  return out;
}

function offeringSearchBlob(p: ProviderProfile, o: ProviderServiceOffering): string {
  return [p.displayName, p.headline, o.serviceName, ...o.tags, o.rateSummary]
    .join(" ")
    .toLowerCase();
}

/**
 * Search: one row per (provider, offering) that matches the query so multi-service
 * providers appear multiple times when relevant.
 */
export function discoveryMatchesForSearch(
  providers: ProviderProfile[],
  normalized: string,
  limit = 16,
): DiscoveryCardStatic[] {
  const q = normalized.trim().toLowerCase();
  if (!q) return [];
  const out: DiscoveryCardStatic[] = [];
  outer: for (const p of providers) {
    for (const o of publicOfferings(p.offerings)) {
      if (offeringSearchBlob(p, o).includes(q)) {
        out.push(toCard(p, o));
        if (out.length >= limit) break outer;
      }
    }
  }
  return out;
}

/** Sample section: every public offering is its own card. */
export function allSampleDiscoveryCards(providers: ProviderProfile[]): DiscoveryCardStatic[] {
  const out: DiscoveryCardStatic[] = [];
  for (const p of providers) {
    for (const o of publicOfferings(p.offerings)) {
      out.push(toCard(p, o));
    }
  }
  return out;
}
