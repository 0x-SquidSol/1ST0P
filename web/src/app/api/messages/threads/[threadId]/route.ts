import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  readApplicantSession,
} from "@/lib/messages-session-cookie";
import {
  appendMessage,
  getThreadById,
} from "@/lib/dev-marketplace-store";
import { z } from "zod";

type RouteCtx = { params: Promise<{ threadId: string }> };

const postBody = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function GET(_req: Request, ctx: RouteCtx) {
  const { threadId } = await ctx.params;
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const thread = getThreadById(threadId);
  if (!thread || thread.participantWallet !== session.wallet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ thread });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const { threadId } = await ctx.params;
  const jar = await cookies();
  const session = readApplicantSession(jar.get(APPLICANT_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const thread = getThreadById(threadId);
  if (!thread || thread.participantWallet !== session.wallet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 422 });
  }

  const msg = appendMessage(threadId, "applicant", parsed.data.body);
  if (!msg) {
    return NextResponse.json(
      { error: "Thread closed or missing" },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: msg, thread: getThreadById(threadId) });
}
