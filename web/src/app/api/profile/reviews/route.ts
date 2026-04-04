import { NextResponse } from "next/server";
import { getReviewsForProvider } from "@/lib/dev-marketplace-store";

/**
 * GET /api/profile/reviews?provider=slug
 * Public endpoint — returns deal-based reviews for a provider.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  if (!provider) {
    return NextResponse.json({ error: "Provide ?provider=slug" }, { status: 400 });
  }

  const dealReviews = getReviewsForProvider(provider);

  return NextResponse.json({
    reviews: dealReviews.map((r) => ({
      id: r.id,
      providerSlug: r.providerSlug,
      serviceName: r.serviceName,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
    })),
  });
}
