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

const milestoneSchema = z.object({
  title: z.string().trim().min(2).max(120),
  deliverable: z.string().trim().min(2).max(1000),
  amountSol: z.number().positive().max(1_000_000),
  dueDate: z.string().trim().min(1).max(40),
});

const draftSchema = z.object({
  projectTitle: z.string().trim().min(2).max(140),
  scopeSummary: z.string().trim().min(2).max(4000),
  startDate: z.string().trim().min(1).max(40),
  targetDate: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(2000).default(""),
  milestones: z.array(milestoneSchema).min(1).max(12),
});

/**
 * POST /api/marketplace/deals/[dealId]/agree
 *
 * Actions:
 *   { action: "save_draft", draft: {...} }  — save/update agreement draft
 *   { action: "lock" }                      — lock the agreement (no more edits)
 *   { action: "unlock" }                    — unlock back to drafting
 *   { action: "sign" }                      — sign the locked agreement
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
