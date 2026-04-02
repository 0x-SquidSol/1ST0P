"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

type ProfileData = {
  wallet: string;
  username: string;
  createdAt: string;
  stats: {
    activeDeals: number;
    completedDeals: number;
    totalDeals: number;
  };
  provider: { slug: string; displayName: string } | null;
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) return;
    setErr(null);
    // First resolve username → wallet
    const lookupRes = await fetch(`/api/profile/lookup?username=${encodeURIComponent(username)}`);
    if (lookupRes.status === 404) { setErr("User not found."); return; }
    if (!lookupRes.ok) { setErr("Could not load profile."); return; }
    const lookup = (await lookupRes.json()) as { wallet: string };

    // Then get full profile
    const res = await fetch(`/api/profile/${lookup.wallet}`);
    if (!res.ok) { setErr("Could not load profile."); return; }
    const data = (await res.json()) as ProfileData;
    setProfile(data);
  }, [username]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Profile"
          title={profile ? profile.username : username}
          description={profile ? `Member since ${new Date(profile.createdAt).toLocaleDateString()}` : ""}
        />
        <Link href="/"
          className="mt-4 inline-block text-sm text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200">
          ← Home
        </Link>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {err && <p className="text-sm text-red-400">{err}</p>}
        {profile ? (
          <div className="space-y-6">
            {/* Identity */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4">
              <p className="text-lg font-semibold text-zinc-100">{profile.username}</p>
              <p className="mt-1 font-mono text-xs text-zinc-500">{profile.wallet}</p>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Active Deals" value={profile.stats.activeDeals} />
              <StatCard label="Completed" value={profile.stats.completedDeals} />
              <StatCard label="Total Deals" value={profile.stats.totalDeals} />
            </div>

            {/* Provider link */}
            {profile.provider && (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Service Provider</p>
                <Link
                  href={`/marketplace/providers/${profile.provider.slug}`}
                  className="text-sm text-violet-400 underline underline-offset-2 hover:text-violet-300"
                >
                  {profile.provider.displayName} →
                </Link>
              </div>
            )}
          </div>
        ) : !err ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : null}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-950/45 p-4 text-center">
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
