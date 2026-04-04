import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_AUTH_COOKIE,
  readAdminSession,
} from "@/lib/admin-session-cookie";
import { adminReleasePayout, getDealThreadById } from "@/lib/dev-marketplace-store";

/** POST /api/admin/deals/[dealId]/release — admin releases payment. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> },
) {
  const jar = await cookies();
  const session = readAdminSession(jar.get(ADMIN_AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { dealId } = await params;
  const result = adminReleasePayout(dealId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({
    deal: getDealThreadById(dealId),
    released: true,
  });
}
