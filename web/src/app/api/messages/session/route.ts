import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APPLICANT_SESSION_COOKIE,
  sealApplicantSession,
} from "@/lib/messages-session-cookie";
import { consumeNonce } from "@/lib/messages-nonce-store";
import {
  loginMessageText,
  parseLoginMessage,
  verifyWalletSignMessage,
} from "@/lib/verify-wallet-sign-message";
import { z } from "zod";

const bodySchema = z.object({
  wallet: z.string().min(32).max(64),
  message: z.string().min(10).max(500),
  signature: z.string().min(32).max(200),
});

const SESSION_MS = 48 * 60 * 60 * 1000; // 48 hours

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

  const { wallet, message, signature } = parsed.data;
  const parts = parseLoginMessage(message);
  if (!parts || parts.wallet !== wallet) {
    return NextResponse.json({ error: "Invalid message format" }, { status: 422 });
  }

  if (message !== loginMessageText(wallet, parts.nonce)) {
    return NextResponse.json({ error: "Message mismatch" }, { status: 422 });
  }

  if (!consumeNonce(parts.nonce)) {
    return NextResponse.json(
      { error: "Nonce expired or already used — request a new one" },
      { status: 401 },
    );
  }

  if (!verifyWalletSignMessage(wallet, message, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let token: string;
  try {
    token = sealApplicantSession(wallet, SESSION_MS);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const jar = await cookies();
  jar.set(APPLICANT_SESSION_COOKIE, token, {
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
  jar.delete(APPLICANT_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
