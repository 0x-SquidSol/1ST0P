"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReputationStarRow } from "@/components/ReputationStarRow";
import {
  formatReputationLine,
  MARKETPLACE_REVIEWS_STORAGE_KEY,
  MARKETPLACE_REVIEWS_UPDATED_EVENT,
  reputationForProviderService,
} from "@/lib/marketplace-reviews";
import { serviceNameToSlug } from "@/lib/marketplace-services";
import type { ProviderRateModel, ProviderServiceOffering } from "@/lib/provider-profile";

function rateModelLabel(model: ProviderRateModel): string {
  switch (model) {
    case "hourly":
      return "Hourly";
    case "fixed_range":
      return "Fixed / range";
    case "project":
      return "Project-based";
    case "custom":
      return "Custom quote";
  }
}

function gridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  return "grid-cols-1 md:grid-cols-3";
}

type Props = {
  providerSlug: string;
  offerings: ProviderServiceOffering[];
};

export function ProviderServiceColumns({ providerSlug, offerings }: Props) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MARKETPLACE_REVIEWS_STORAGE_KEY) bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MARKETPLACE_REVIEWS_UPDATED_EVENT, bump);
    };
  }, [bump]);

  const summaries = useMemo(() => {
    void version;
    return offerings.map((o) => ({
      serviceName: o.serviceName,
      rep: reputationForProviderService(providerSlug, o.serviceName, {
        listingRating: o.listingRating,
        reviewCount: o.reviewCount,
      }),
    }));
  }, [providerSlug, offerings, version]);

  return (
    <ul className={`grid min-w-0 gap-4 ${gridClass(offerings.length)}`}>
      {offerings.map((o, i) => {
        const rep = summaries[i]?.rep;
        const line = rep ? formatReputationLine(rep) : "";
        const hasNumeric =
          rep != null && rep.reviewCount > 0 && rep.avgRating != null;

        return (
          <li key={o.serviceName}>
            <div className="polish-trust-tile flex h-full min-h-[280px] flex-col rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-semibold leading-snug text-zinc-100">
                  {o.serviceName}
                </h3>
                <Link
                  href={`/marketplace/browse/${serviceNameToSlug(o.serviceName)}`}
                  className="shrink-0 text-[11px] font-medium text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
                >
                  Category →
                </Link>
              </div>

              {o.tags.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <li key={t}>
                      <span className="inline-block rounded-md border border-white/10 bg-zinc-900/60 px-2 py-0.5 text-[11px] text-zinc-400">
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-4 text-sm font-medium leading-snug text-zinc-200">
                {o.rateSummary}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Model: {rateModelLabel(o.rateModel)}
              </p>

              <div className="mt-auto border-t border-white/[0.06] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  This service
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  {hasNumeric ? (
                    <>
                      <span
                        role="img"
                        aria-label={`${rep!.avgRating!.toFixed(1)} out of 5 stars`}
                      >
                        <ReputationStarRow rating={rep!.avgRating!} />
                      </span>
                      <span className="text-sm font-medium text-zinc-200">
                        {line}
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500">{line}</p>
                  )}
                </div>
                <a
                  href="#provider-reviews"
                  className="mt-2 inline-block text-xs font-medium text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
                >
                  All reviews below →
                </a>
                <Link
                  href={`/marketplace/hire/${providerSlug}?service=${encodeURIComponent(
                    o.serviceName,
                  )}`}
                  className="mt-3 inline-flex rounded-lg border border-white/15 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-white/25 hover:bg-zinc-900"
                >
                  Hire for this service
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
