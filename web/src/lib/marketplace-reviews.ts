/**
 * Off-chain review scaffolding (Phase 2 commit 4).
 * Seed data + localStorage for demos; replace with API later.
 */

import type { ProviderProfile } from "@/lib/provider-profile";

export type ReputationFallback = {
  listingRating?: number;
  reviewCount?: number;
};

export type MarketplaceReview = {
  id: string;
  providerSlug: string;
  /** Which offered service this review applies to (directory service name). */
  serviceName: string;
  reviewerWallet: string;
  rating: number;
  text: string;
  createdAt: string;
  /** base58-encoded signature of canonical payload when wallet signed */
  signatureBase58?: string;
  /** true when wallet could not sign (adapter limitation) */
  unsigned?: boolean;
};

export const MARKETPLACE_REVIEWS_STORAGE_KEY = "1st0p:marketplace-reviews-v1";
export const MARKETPLACE_REVIEWS_UPDATED_EVENT = "1st0p:reviews-updated";

const STORAGE_KEY = MARKETPLACE_REVIEWS_STORAGE_KEY;

/** Initial demo reviews (visible on SSR from seed; totals drive aggregates when no localStorage). */
export const SEED_MARKETPLACE_REVIEWS: MarketplaceReview[] = [
  {
    id: "seed-nexus-1",
    providerSlug: "nexus-labs",
    serviceName: "Smart Contract Engineers",
    reviewerWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    rating: 5,
    text: "Shipped Anchor upgrades ahead of schedule; clear docs and handoff.",
    createdAt: "2025-12-01T15:00:00.000Z",
    unsigned: true,
  },
  {
    id: "seed-nexus-2",
    providerSlug: "nexus-labs",
    serviceName: "Smart Contract Auditors",
    reviewerWallet: "GjJyeC1rFnNg9wViVFjCzMZJb5dA79HyFzBzrmdUWgJK",
    rating: 5,
    text: "Audit findings were actionable; would hire again for Solana infra.",
    createdAt: "2025-11-18T12:30:00.000Z",
    unsigned: true,
  },
  {
    id: "seed-signal-1",
    providerSlug: "signal-growth",
    serviceName: "KOL Managers",
    reviewerWallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    rating: 5,
    text: "Launch week coordination was tight; daily metrics we could share with investors.",
    createdAt: "2025-12-10T09:00:00.000Z",
    unsigned: true,
  },
  {
    id: "seed-signal-2",
    providerSlug: "signal-growth",
    serviceName: "Raid Teams",
    reviewerWallet: "5FHneW46xGXgsF5A4tT9z1wWpYbZUjqJQxW8nKz8mLvk",
    rating: 4,
    text: "Strong raid structure; a few timezone handoffs to improve next time.",
    createdAt: "2025-11-28T17:45:00.000Z",
    unsigned: true,
  },
];

export function canonicalReviewPayload(parts: {
  providerSlug: string;
  serviceName: string;
  reviewerWallet: string;
  rating: number;
  text: string;
  createdAt: string;
}): string {
  return JSON.stringify({
    v: 2,
    providerSlug: parts.providerSlug,
    serviceName: parts.serviceName,
    reviewerWallet: parts.reviewerWallet,
    rating: parts.rating,
    text: parts.text.trim(),
    createdAt: parts.createdAt,
  });
}

export function seedReviewsForProvider(slug: string): MarketplaceReview[] {
  return SEED_MARKETPLACE_REVIEWS.filter((r) => r.providerSlug === slug);
}

function parseStoredReviews(): MarketplaceReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as MarketplaceReview[]).map((r) => ({
      ...r,
      serviceName: r.serviceName ?? "General",
    }));
  } catch {
    return [];
  }
}

export function loadUserSubmittedReviews(): MarketplaceReview[] {
  return parseStoredReviews();
}

export function appendUserReview(review: MarketplaceReview): void {
  if (typeof window === "undefined") return;
  const prev = parseStoredReviews();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, review]));
  window.dispatchEvent(new Event(MARKETPLACE_REVIEWS_UPDATED_EVENT));
}

export function mergedReviewsForProvider(slug: string): MarketplaceReview[] {
  const user = parseStoredReviews().filter((r) => r.providerSlug === slug);
  const seed = seedReviewsForProvider(slug);
  return [...seed, ...user];
}

export function mergedReviewsForProviderService(
  slug: string,
  serviceName: string,
): MarketplaceReview[] {
  return mergedReviewsForProvider(slug).filter((r) => r.serviceName === serviceName);
}

export type ReputationSummary = {
  avgRating: number | null;
  reviewCount: number;
};

export function reputationFromReviewList(
  reviews: MarketplaceReview[],
  fallback: ReputationFallback,
): ReputationSummary {
  if (reviews.length === 0) {
    return {
      avgRating: fallback.listingRating ?? null,
      reviewCount: fallback.reviewCount ?? 0,
    };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    avgRating: sum / reviews.length,
    reviewCount: reviews.length,
  };
}

export function reputationForProviderSlug(
  slug: string,
  profileFallback: ReputationFallback,
): ReputationSummary {
  return reputationFromReviewList(mergedReviewsForProvider(slug), profileFallback);
}

export function reputationForProviderService(
  slug: string,
  serviceName: string,
  offeringFallback: ReputationFallback,
): ReputationSummary {
  return reputationFromReviewList(
    mergedReviewsForProviderService(slug, serviceName),
    offeringFallback,
  );
}

/** Server-safe: seed only (no localStorage). */
export function reputationForProviderSlugServer(
  slug: string,
  profileFallback: ReputationFallback,
): ReputationSummary {
  return reputationFromReviewList(seedReviewsForProvider(slug), profileFallback);
}

export function formatReputationLine(rep: ReputationSummary): string {
  if (rep.reviewCount <= 0 || rep.avgRating == null) {
    return "Reviews after first completed job";
  }
  return `${rep.avgRating.toFixed(1)} / 5 · ${rep.reviewCount} reviews`;
}

export function sortProvidersByReputation(
  providers: ProviderProfile[],
  order: "high" | "low",
): ProviderProfile[] {
  const mult = order === "high" ? -1 : 1;
  return [...providers].sort((a, b) => {
    const ra = reputationForProviderSlugServer(a.slug, {
      listingRating: a.listingRating,
      reviewCount: a.reviewCount,
    });
    const rb = reputationForProviderSlugServer(b.slug, {
      listingRating: b.listingRating,
      reviewCount: b.reviewCount,
    });
    const sa = ra.avgRating ?? 0;
    const sb = rb.avgRating ?? 0;
    if (sa !== sb) return mult * (sa < sb ? -1 : sa > sb ? 1 : 0);
    const ca = ra.reviewCount;
    const cb = rb.reviewCount;
    if (ca !== cb) return mult * (ca < cb ? -1 : ca > cb ? 1 : 0);
    return a.displayName.localeCompare(b.displayName);
  });
}

export function shortenWallet(pubkey: string, chars = 4): string {
  if (pubkey.length <= chars * 2 + 1) return pubkey;
  return `${pubkey.slice(0, chars)}…${pubkey.slice(-chars)}`;
}
