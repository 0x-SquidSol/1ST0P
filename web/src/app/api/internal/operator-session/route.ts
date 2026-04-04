import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OPERATOR_SESSION_COOKIE,
  operatorSecretOk,
  sealOperatorSession,
} from "@/lib/messages-session-cookie";
import { z } from "zod";

const bodySchema = z.object({
  secret: z.string().min(1).max(200),
});

const SESSION_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function POST(req: Request) {
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

  if (!operatorSecretOk(parsed.data.secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let token: string;
  try {
    token = sealOperatorSession(SESSION_MS);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const jar = await cookies();
  jar.set(OPERATOR_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(OPERATOR_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
