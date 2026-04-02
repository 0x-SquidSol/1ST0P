import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  getDealThreadById,
  setDealStatus,
} from "@/lib/dev-marketplace-store";

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

  let json: { action?: string };
  try {
    json = (await req.json()) as { action?: string };
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

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
