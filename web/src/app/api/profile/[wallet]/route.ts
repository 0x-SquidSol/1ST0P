import { NextResponse } from "next/server";
import {
  getUserByWallet,
  listDealThreadsForWallet,
} from "@/lib/dev-marketplace-store";
import { getProviderBySlug } from "@/lib/mock-providers";

/** GET /api/profile/[wallet] — public profile lookup by wallet. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ wallet: string }> },
) {
  const { wallet } = await params;
  const user = getUserByWallet(wallet);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Gather deal stats
  const deals = listDealThreadsForWallet(wallet);
  const activeDeals = deals.filter((d) => d.status === "active").length;
  const completedDeals = deals.filter((d) => d.status === "completed").length;

  // Check if they're a provider
  const providerDeal = deals.find((d) => d.providerWallet === wallet);
  const providerSlug = providerDeal?.providerSlug ?? null;
  const providerProfile = providerSlug ? getProviderBySlug(providerSlug) : null;

  return NextResponse.json({
    wallet: user.wallet,
    username: user.username,
    createdAt: user.createdAt,
    stats: {
      activeDeals,
      completedDeals,
      totalDeals: deals.length,
    },
    provider: providerProfile
      ? { slug: providerProfile.slug, displayName: providerProfile.displayName }
      : null,
  });
}
