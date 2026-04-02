import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  getDealThreadById,
  initAgreement,
  signAgreement,
} from "@/lib/dev-marketplace-store";

/**
 * POST /api/marketplace/deals/[dealId]/agree
 *
 * Actions:
 *   { action: "init" }   — provider triggers agreement (after accepting)
 *   { action: "sign" }   — buyer or provider signs the agreement
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> },
) {
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { dealId } = await params;
  const deal = getDealThreadById(dealId);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const wallet = session.wallet;
  const isBuyer = deal.buyerWallet === wallet;
  const isProvider = deal.providerWallet === wallet;
  if (!isBuyer && !isProvider) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "init") {
    // Only provider can initiate agreement flow (after accepting deal)
    if (!isProvider) {
      return NextResponse.json(
        { error: "Only the provider can initiate the agreement" },
        { status: 403 },
      );
    }
    const result = initAgreement(dealId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ deal: result });
  }

  if (body.action === "sign") {
    const role = isBuyer ? "buyer" : "provider";
    const result = signAgreement(dealId, role);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ deal: result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
