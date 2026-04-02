import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import { appendDealMessage, getDealThreadById } from "@/lib/dev-marketplace-store";

type RouteCtx = { params: Promise<{ dealId: string }> };

const bodySchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function POST(req: Request, ctx: RouteCtx) {
  const { dealId } = await ctx.params;
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const deal = getDealThreadById(dealId);
  if (
    !deal ||
    (deal.buyerWallet !== session.wallet && deal.providerWallet !== session.wallet)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 422 });
  }

  const role = deal.buyerWallet === session.wallet ? "buyer" : "provider";
  const msg = appendDealMessage(dealId, role, parsed.data.body);
  if (!msg) {
    return NextResponse.json({ error: "Missing deal thread" }, { status: 404 });
  }

  return NextResponse.json({
    message: msg,
    deal: getDealThreadById(dealId),
    participantRole: role,
  });
}
