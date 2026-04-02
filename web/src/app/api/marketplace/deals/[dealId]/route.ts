import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  appendDealMessage,
  getDealThreadById,
  setDealStatus,
  type DealReviewStatus,
} from "@/lib/dev-marketplace-store";

type RouteCtx = { params: Promise<{ dealId: string }> };

const patchSchema = z.object({
  status: z.enum(["proposed", "changes_requested", "accepted", "declined"]),
  note: z.string().trim().min(1).max(2000).optional(),
});

function isParticipant(
  wallet: string,
  deal: { buyerWallet: string; providerWallet: string },
) {
  return deal.buyerWallet === wallet || deal.providerWallet === wallet;
}

function providerCanSetStatus(current: DealReviewStatus, next: DealReviewStatus): boolean {
  if (next === "accepted" || next === "declined" || next === "changes_requested") {
    return current !== "accepted" && current !== "declined";
  }
  return false;
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
  if (deal.providerWallet !== session.wallet) {
    return NextResponse.json(
      { error: "Only the provider can update proposal decision state" },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 422 });
  }
  if (!providerCanSetStatus(deal.status, parsed.data.status)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 422 });
  }

  const updated = setDealStatus(dealId, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const defaultNote =
    parsed.data.status === "accepted"
      ? "Provider accepted the milestone proposal."
      : parsed.data.status === "declined"
        ? "Provider declined this proposal."
        : "Provider requested changes to this proposal.";
  appendDealMessage(
    dealId,
    "provider",
    parsed.data.note ? parsed.data.note : defaultNote,
  );

  return NextResponse.json({
    deal: getDealThreadById(dealId),
    participantRole: "provider",
  });
}
