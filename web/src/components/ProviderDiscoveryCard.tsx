"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ReputationStarRow } from "@/components/ReputationStarRow";
import type { DiscoveryCardStatic } from "@/lib/discovery-cards";
import { reputationForProviderService } from "@/lib/marketplace-reviews";

type Variant = "grid" | "compact" | "sample" | "sampleCompact";

export function ProviderDiscoveryCard({
  card,
  refreshVersion = 0,
  variant = "grid",
  onNavigate,
}: {
  card: DiscoveryCardStatic;
  /** Bump when reviews in localStorage change (parent listens for storage / custom event). */
  refreshVersion?: number;
  variant?: Variant;
  onNavigate?: () => void;
}) {
  const rep = useMemo(() => {
    void refreshVersion;
    return reputationForProviderService(
      card.providerSlug,
      card.serviceName,
      {
        listingRating: card.listingRating,
        reviewCount: card.reviewCount,
      },
    );
  }, [card, refreshVersion]);

  const avg = rep.avgRating ?? 0;
  const count = rep.reviewCount;

  const starClass =
    variant === "compact" || variant === "sampleCompact"
      ? "text-sm"
      : variant === "sample"
        ? "text-base"
        : "text-lg";

  const inner = (
    <>
      <span
        className={
          variant === "compact" || variant === "sampleCompact"
            ? "font-medium text-zinc-100"
            : "text-base font-semibold text-zinc-100"
        }
      >
        {card.displayName}
      </span>
      <span
        className={
          variant === "compact" || variant === "sampleCompact"
            ? "mt-0.5 block text-[11px] text-zinc-500"
            : "mt-1 block text-sm text-zinc-500"
        }
      >
        {card.serviceName}
      </span>
      <div
        className={
          variant === "compact" || variant === "sampleCompact"
            ? "mt-1.5 flex flex-wrap items-center gap-2"
            : "mt-3 flex flex-wrap items-center gap-2"
        }
      >
        <span
          role="img"
          aria-label={
            rep.avgRating != null
              ? `${rep.avgRating.toFixed(1)} out of 5 stars`
              : "No rating yet"
          }
        >
          <ReputationStarRow rating={avg} className={starClass} />
        </span>
        <span className="text-zinc-500">
          (<span className="tabular-nums text-zinc-400">{count}</span>)
        </span>
      </div>
    </>
  );

  const linkProps = {
    href: `/marketplace/providers/${card.providerSlug}` as const,
    onClick: () => onNavigate?.(),
  };

  if (variant === "grid") {
    return (
      <Link
        {...linkProps}
        className="polish-card-interactive flex min-h-[120px] flex-col rounded-2xl border border-white/10 bg-zinc-950/45 p-4 sm:p-5"
      >
        {inner}
      </Link>
    );
  }

  if (variant === "sample") {
    return (
      <Link
        {...linkProps}
        className="polish-card-interactive flex min-h-[120px] flex-col rounded-2xl bg-zinc-950/45 p-4 sm:p-5"
      >
        {inner}
      </Link>
    );
  }

  if (variant === "sampleCompact") {
    return (
      <Link
        {...linkProps}
        className="polish-card-interactive flex flex-col rounded-xl border border-white/10 bg-zinc-950/50 p-3 transition"
      >
        {inner}
      </Link>
    );
  }

  /* compact — search dropdown row */
  return (
    <Link
      {...linkProps}
      className="block rounded-lg px-2 py-2 text-sm text-zinc-200 hover:bg-zinc-900/80"
    >
      {inner}
    </Link>
  );
}
