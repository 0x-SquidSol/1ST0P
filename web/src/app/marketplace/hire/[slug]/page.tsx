import Link from "next/link";
import { notFound } from "next/navigation";
import { DealProposalComposer } from "@/components/DealProposalComposer";
import { PageHeader } from "@/components/PageHeader";
import { getProviderBySlug } from "@/lib/mock-providers";
import { publicOfferings } from "@/lib/provider-profile";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function HireProviderPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = getProviderBySlug(slug);
  if (!profile || !profile.approved) notFound();

  const offerings = publicOfferings(profile.offerings).map((o) => o.serviceName);
  if (offerings.length === 0) notFound();
  const initialServiceName =
    query.service && offerings.includes(query.service) ? query.service : offerings[0];

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title={`Hire ${profile.displayName}`}
          description="Create a milestone proposal tied to a specific service. This opens a shared buyer-provider deal chat."
        />
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/marketplace/providers/${profile.slug}`}
            className="text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
          >
            ← Back to provider profile
          </Link>
          <Link
            href="/marketplace/deals"
            className="text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
          >
            My deal chats
          </Link>
        </div>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        <DealProposalComposer
          providerSlug={profile.slug}
          providerDisplayName={profile.displayName}
          serviceOptions={offerings}
          initialServiceName={initialServiceName}
        />
      </section>
    </div>
  );
}
