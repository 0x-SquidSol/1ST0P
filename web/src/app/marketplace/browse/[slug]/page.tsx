import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowseProvidersGrid } from "@/components/BrowseProvidersGrid";
import { PageHeader } from "@/components/PageHeader";
import {
  allMarketplaceBrowseSlugs,
  getServiceNameFromBrowseSlug,
} from "@/lib/marketplace-services";
import {
  discoveryCardsForBrowse,
  sortDiscoveryCardsByReputation,
} from "@/lib/discovery-cards";
import { listPublicProviders } from "@/lib/mock-providers";
import { providersOfferingService } from "@/lib/provider-lanes";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allMarketplaceBrowseSlugs().map((slug) => ({ slug }));
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
  const cards = sortDiscoveryCardsByReputation(
    discoveryCardsForBrowse(providers, serviceName),
  );

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
        {cards.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No approved providers in this category yet. When applications are
            accepted, they appear here automatically if they offer this service.
          </p>
        ) : (
          <BrowseProvidersGrid cards={cards} />
        )}
      </section>
    </div>
  );
}
