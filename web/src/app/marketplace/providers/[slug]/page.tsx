import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProviderProfileView } from "@/components/ProviderProfileView";
import { getProviderBySlug, listPublicProviders } from "@/lib/mock-providers";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return listPublicProviders().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProviderBySlug(slug);
  if (!profile) {
    return { title: "Provider — 1ST0P" };
  }
  return {
    title: `${profile.displayName} — Marketplace`,
    description: profile.headline,
  };
}

export default async function ProviderProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = getProviderBySlug(slug);

  if (!profile) {
    notFound();
  }

  if (!profile.approved) {
    return (
      <div className="polish-surface-page max-w-full min-w-0 space-y-4 rounded-3xl bg-zinc-950/52 p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-100">
          Profile not available
        </h1>
        <p className="text-sm text-zinc-400">
          This provider is not approved for public listing yet. Only approved
          profiles appear in the sample directory.
        </p>
        <Link
          href="/marketplace#sample-providers"
          className="inline-block text-sm text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-zinc-100"
        >
          Return to marketplace
        </Link>
      </div>
    );
  }

  return <ProviderProfileView profile={profile} />;
}
