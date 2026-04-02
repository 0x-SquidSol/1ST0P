import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  getDealThreadById,
  updateMilestoneEscrow,
  type MilestoneEscrowStatus,
} from "@/lib/dev-marketplace-store";

const patchSchema = z.object({
  milestoneId: z.string().min(1),
  escrowStatus: z.enum(["pending", "in_progress", "released", "disputed"]),
});

/**
 * PATCH /api/marketplace/deals/[dealId]/milestones
 *
 * Update a milestone's escrow status. Both parties can mark
 * in_progress or disputed; release requires both parties to
 * have confirmed (future: on-chain check).
 */
export async function PATCH(
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
  if (deal.buyerWallet !== wallet && deal.providerWallet !== wallet) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const result = updateMilestoneEscrow(
    dealId,
    parsed.data.milestoneId,
    parsed.data.escrowStatus as MilestoneEscrowStatus,
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ deal: result });
}
