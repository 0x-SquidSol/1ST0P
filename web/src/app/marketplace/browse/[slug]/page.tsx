import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import {
  allMarketplaceBrowseSlugs,
  getServiceNameFromBrowseSlug,
} from "@/lib/marketplace-services";
import { listPublicProviders } from "@/lib/mock-providers";
import type { ProviderProfile } from "@/lib/provider-profile";
import { providersOfferingService } from "@/lib/provider-lanes";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allMarketplaceBrowseSlugs().map((slug) => ({ slug }));
}

function trustLine(p: ProviderProfile): string {
  const r = p.listingRating;
  const n = p.reviewCount ?? 0;
  if (r != null && n > 0) return `${r.toFixed(1)} / 5 · ${n} reviews`;
  if (r != null) return `${r.toFixed(1)} / 5`;
  return "Reviews after first completed job";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = getServiceNameFromBrowseSlug(slug);
  if (!name) return { title: "Service — Marketplace" };
  return {
    title: `${name} — Marketplace`,
    description: `Browse approved providers offering ${name} on 1ST0P.`,
  };
}

export default async function MarketplaceServiceBrowsePage({ params }: Props) {
  const { slug } = await params;
  const serviceName = getServiceNameFromBrowseSlug(slug);
  if (!serviceName) notFound();

  const providers = providersOfferingService(listPublicProviders(), serviceName);

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title={serviceName}
          description="Approved providers only. Each listing uses the same profile layout—only the details change once applications feed the directory."
        />
        <p className="mt-5 text-sm text-zinc-400">
          <Link
            href="/marketplace?tab=search"
            className="font-medium text-zinc-100 underline decoration-white/25 underline-offset-4 transition hover:decoration-white/50"
          >
            ← Back to service search
          </Link>
        </p>
      </section>

      <section className="polish-surface-subtle rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {providers.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No approved providers in this category yet. When applications are
            accepted, they appear here automatically if they offer this service.
          </p>
        ) : (
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
                    {p.rateSummary}
                  </span>
                  <span className="mt-2 text-xs text-zinc-600">
                    Full profile →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
