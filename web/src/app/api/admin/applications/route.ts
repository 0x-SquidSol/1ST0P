import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, readAdminSession } from "@/lib/admin-session-cookie";
import { listStoredApplications } from "@/lib/dev-marketplace-store";

export async function GET() {
  const jar = await cookies();
  if (!readAdminSession(jar.get(ADMIN_AUTH_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apps = listStoredApplications().map((a) => ({
    id: a.id,
    submittedAt: a.submittedAt,
    reviewStatus: a.reviewStatus,
    publicSlug: a.publicSlug,
    approvedAt: a.approvedAt,
    displayName: a.payload.displayName,
    headline: a.payload.headline,
    applicantWallet: a.payload.applicantWallet,
  }));

  return NextResponse.json({ applications: apps });
}
