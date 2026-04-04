import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  getDealThreadById,
  markDealComplete,
  resolveDisplayName,
  setDealStatus,
  submitDealReview,
} from "@/lib/dev-marketplace-store";
import { sanitizeText } from "@/lib/sanitize";

type RouteCtx = { params: Promise<{ dealId: string }> };

function isParticipant(
  wallet: string,
  deal: { buyerWallet: string; providerWallet: string },
) {
  return deal.buyerWallet === wallet || deal.providerWallet === wallet;
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const { dealId } = await ctx.params;
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const deal = getDealThreadById(dealId);
  if (!deal || !isParticipant(session.wallet, deal)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    deal,
    participantRole: deal.buyerWallet === session.wallet ? "buyer" : "provider",
    displayNames: {
      buyer: resolveDisplayName(deal.buyerWallet),
      provider: resolveDisplayName(deal.providerWallet),
    },
  });
}

/** PATCH — cancel a deal (either party, only before active). */
export async function PATCH(req: Request, ctx: RouteCtx) {
  const { dealId } = await ctx.params;
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const deal = getDealThreadById(dealId);
  if (!deal || !isParticipant(session.wallet, deal)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: { action?: string; rating?: number; reviewText?: string };
  try {
    json = (await req.json()) as { action?: string; rating?: number; reviewText?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (json.action === "cancel") {
    if (deal.status === "active" || deal.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel an active or completed deal" },
        { status: 422 },
      );
    }
    setDealStatus(dealId, "cancelled");
    return NextResponse.json({
      deal: getDealThreadById(dealId),
      participantRole: deal.buyerWallet === session.wallet ? "buyer" : "provider",
    });
  }

  // Buyer: submit review + mark complete (mandatory review before completion)
  if (json.action === "review_and_complete") {
    if (deal.buyerWallet !== session.wallet) {
      return NextResponse.json({ error: "Only the buyer can review" }, { status: 403 });
    }
    if (typeof json.rating !== "number" || json.rating < 1 || json.rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 422 });
    }
    if (!json.reviewText || json.reviewText.trim().length < 50) {
      return NextResponse.json({ error: "Review must be at least 50 characters" }, { status: 422 });
    }
    const result = submitDealReview(
      dealId,
      session.wallet,
      json.rating,
      sanitizeText(json.reviewText),
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({
      deal: getDealThreadById(dealId),
      participantRole: "buyer",
      review: result.review,
    });
  }

  // Provider: mark complete (no review required)
  if (json.action === "mark_complete") {
    const role = deal.buyerWallet === session.wallet ? "buyer" : "provider";
    if (role === "buyer") {
      return NextResponse.json(
        { error: "Buyers must use review_and_complete to submit a review first" },
        { status: 422 },
      );
    }
    const result = markDealComplete(dealId, role);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({
      deal: getDealThreadById(dealId),
      participantRole: role,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
