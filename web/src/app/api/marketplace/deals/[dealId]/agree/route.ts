import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  getDealThreadById,
  saveDraftAgreement,
  lockAgreement,
  unlockAgreement,
  signAgreement,
} from "@/lib/dev-marketplace-store";

const draftSchema = z.object({
  serviceType: z.string().trim().min(2).max(140),
  scopeDetails: z.string().trim().min(2).max(20000),
  timeline: z.string().trim().min(2).max(2000),
  totalCostSol: z.number().positive().max(1_000_000),
});

/**
 * POST /api/marketplace/deals/[dealId]/agree
 *
 * Actions:
 *   { action: "save_draft", draft: {...} }  — save/update contract draft
 *   { action: "lock" }                      — lock the contract (no more edits)
 *   { action: "unlock" }                    — unlock back to drafting
 *   { action: "sign" }                      — sign the locked contract
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
  const role = isBuyer ? "buyer" : "provider";

  let body: { action?: string; draft?: unknown };
  try {
    body = (await req.json()) as { action?: string; draft?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "save_draft") {
    const parsed = draftSchema.safeParse(body.draft);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 422 });
    }
    const result = saveDraftAgreement(dealId, role, parsed.data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ deal: result });
  }

  if (body.action === "lock") {
    const result = lockAgreement(dealId, role);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ deal: result });
  }

  // Combined save + lock in one serverless invocation (avoids stale instance)
  if (body.action === "save_and_lock") {
    const parsed = draftSchema.safeParse(body.draft);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 422 });
    }
    const saveResult = saveDraftAgreement(dealId, role, parsed.data);
    if ("error" in saveResult) {
      return NextResponse.json({ error: saveResult.error }, { status: 422 });
    }
    const lockResult = lockAgreement(dealId, role);
    if ("error" in lockResult) {
      return NextResponse.json({ error: lockResult.error }, { status: 422 });
    }
    return NextResponse.json({ deal: lockResult });
  }

  // Buyer pays → both signatures applied + deal becomes active
  if (body.action === "pay") {
    if (!isBuyer) {
      return NextResponse.json({ error: "Only the buyer can pay" }, { status: 403 });
    }
    // Auto-sign both parties on payment (payment = agreement to terms)
    const s1 = signAgreement(dealId, "buyer");
    if ("error" in s1) {
      return NextResponse.json({ error: s1.error }, { status: 422 });
    }
    const s2 = signAgreement(dealId, "provider");
    if ("error" in s2) {
      return NextResponse.json({ error: s2.error }, { status: 422 });
    }
    return NextResponse.json({ deal: s2 });
  }

  if (body.action === "unlock") {
    const result = unlockAgreement(dealId, role);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ deal: result });
  }

  if (body.action === "sign") {
    const result = signAgreement(dealId, role);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ deal: result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
