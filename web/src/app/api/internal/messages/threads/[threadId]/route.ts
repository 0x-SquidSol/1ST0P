import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OPERATOR_SESSION_COOKIE,
  readOperatorSession,
} from "@/lib/messages-session-cookie";
import {
  appendMessage,
  getThreadById,
  setThreadStatus,
} from "@/lib/dev-marketplace-store";
import { z } from "zod";

type RouteCtx = { params: Promise<{ threadId: string }> };

const replyBody = z.object({
  body: z.string().trim().min(1).max(8000),
});

const patchBody = z.object({
  status: z.enum(["open", "closed"]),
});

export async function GET(_req: Request, ctx: RouteCtx) {
  const { threadId } = await ctx.params;
  const jar = await cookies();
  const op = readOperatorSession(jar.get(OPERATOR_SESSION_COOKIE)?.value);
  if (!op) {
    return NextResponse.json({ error: "Operator sign-in required" }, { status: 401 });
  }

  const thread = getThreadById(threadId);
  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ thread });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const { threadId } = await ctx.params;
  const jar = await cookies();
  const op = readOperatorSession(jar.get(OPERATOR_SESSION_COOKIE)?.value);
  if (!op) {
    return NextResponse.json({ error: "Operator sign-in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = replyBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 422 });
  }

  const msg = appendMessage(threadId, "operator", parsed.data.body);
  if (!msg) {
    return NextResponse.json(
      { error: "Thread closed or missing" },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: msg, thread: getThreadById(threadId) });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const { threadId } = await ctx.params;
  const jar = await cookies();
  const op = readOperatorSession(jar.get(OPERATOR_SESSION_COOKIE)?.value);
  if (!op) {
    return NextResponse.json({ error: "Operator sign-in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 422 });
  }

  const thread = setThreadStatus(threadId, parsed.data.status);
  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ thread });
}
