import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_AUTH_COOKIE,
  readAdminSession,
} from "@/lib/admin-session-cookie";
import { listAllDeals } from "@/lib/dev-marketplace-store";
import { shortenWallet } from "@/lib/marketplace-reviews";

export async function GET() {
  const jar = await cookies();
  const session = readAdminSession(jar.get(ADMIN_AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const deals = listAllDeals().map((d) => ({
    id: d.id,
    providerDisplayName: d.providerDisplayName,
    providerSlug: d.providerSlug,
    serviceName: d.serviceName,
    buyerWallet: shortenWallet(d.buyerWallet, 6),
    providerWallet: shortenWallet(d.providerWallet, 6),
    status: d.status,
    projectTitle: d.proposal.projectTitle,
    milestoneCount: d.proposal.milestones.length,
    totalSol: d.proposal.milestones.reduce((a, m) => a + m.amountSol, 0),
    agreementSigned:
      d.agreement?.buyerSignedAt && d.agreement?.providerSignedAt
        ? true
        : false,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return NextResponse.json({ deals });
}
