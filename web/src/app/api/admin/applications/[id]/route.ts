import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, readAdminSession } from "@/lib/admin-session-cookie";
import {
  approveStoredApplication,
  getApplicationById,
  markApplicationNeedsInfo,
  markApplicationPending,
  rejectStoredApplication,
} from "@/lib/dev-marketplace-store";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "needs_info", "pending"]),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const jar = await cookies();
  if (!readAdminSession(jar.get(ADMIN_AUTH_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const app = getApplicationById(id);
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ application: app });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const jar = await cookies();
  if (!readAdminSession(jar.get(ADMIN_AUTH_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

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

  const { action } = parsed.data;

  if (action === "approve") {
    const r = approveStoredApplication(id);
    if ("error" in r) {
      return NextResponse.json({ error: r.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, slug: r.slug });
  }

  if (action === "reject") {
    const r = rejectStoredApplication(id);
    if ("error" in r) {
      return NextResponse.json({ error: r.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "needs_info") {
    const r = markApplicationNeedsInfo(id);
    if ("error" in r) {
      return NextResponse.json({ error: r.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const r = markApplicationPending(id);
  if ("error" in r) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
