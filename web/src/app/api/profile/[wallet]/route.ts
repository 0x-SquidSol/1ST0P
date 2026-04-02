import { NextResponse } from "next/server";
import {
  getUserByWallet,
  getApprovedProfilesByWallet,
  listDealThreadsForWallet,
} from "@/lib/dev-marketplace-store";
import { publicOfferings } from "@/lib/provider-profile";

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

  // Deal stats
  const deals = listDealThreadsForWallet(wallet);
  const activeDeals = deals.filter((d) => d.status === "active").length;
  const completedDeals = deals.filter((d) => d.status === "completed").length;

  // Provider listings (approved only)
  const providerProfiles = getApprovedProfilesByWallet(wallet);
  const listings = providerProfiles.map((p) => ({
    slug: p.slug,
    displayName: p.displayName,
    headline: p.headline,
    services: publicOfferings(p.offerings).map((o) => o.serviceName),
    approved: p.approved,
  }));

  return NextResponse.json({
    wallet: user.wallet,
    username: user.username,
    createdAt: user.createdAt,
    stats: {
      activeDeals,
      completedDeals,
      totalDeals: deals.length,
    },
    listings,
  });
}
