/**
 * Marketplace provider profile (UI + future persistence).
 * Phase 2: mock-backed until applications and approval flow ship.
 */

export type ProviderRateModel =
  | "hourly"
  | "fixed_range"
  | "project"
  | "custom";

/** One public service column (max 3 per listing). */
export type ProviderServiceOffering = {
  /** Canonical marketplace service name (matches browse slug / directory). */
  serviceName: string;
  /** Focus areas for this service only (shown in that column). */
  tags: string[];
  rateModel: ProviderRateModel;
  rateSummary: string;
  /** Preview stats when there are no reviews yet for this service */
  listingRating?: number;
  reviewCount?: number;
};

/** Website, X, and GitHub are the only link slots on the public profile (intake enforces ≥1). */
export type ProviderSocialLinks = {
  website?: string;
  x?: string;
  github?: string;
};

/** Max services shown on a public listing (mirror in application validation later). */
export const MAX_PUBLIC_SERVICES = 3;

export function publicOfferings(
  offerings: ProviderServiceOffering[],
): ProviderServiceOffering[] {
  return offerings.slice(0, MAX_PUBLIC_SERVICES);
}

/** Card / sample line: first offering rate, or combined hint. */
export function cardRateSummary(profile: {
  offerings: ProviderServiceOffering[];
}): string {
  const o = profile.offerings[0];
  if (!o) return "Rates on profile";
  if (profile.offerings.length === 1) return o.rateSummary;
  return `${o.rateSummary} · +${profile.offerings.length - 1} more service${profile.offerings.length > 2 ? "s" : ""}`;
}

export type ProviderProfile = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  offerings: ProviderServiceOffering[];
  socialLinks: ProviderSocialLinks;
  /** Manual approval gate — only approved profiles are listed publicly */
  approved: boolean;
  /** ISO date for “member since” style copy */
  memberSince: string;
  /**
   * Card / search preview when aggregating all services;
   * per-service fallbacks live on each offering.
   */
  listingRating?: number;
  reviewCount?: number;
};
