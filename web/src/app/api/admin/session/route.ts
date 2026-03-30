import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminCredentialsConfigured,
  verifyAdminLogin,
} from "@/lib/admin-credentials";
import {
  ADMIN_AUTH_COOKIE,
  readAdminSession,
  sealAdminSession,
} from "@/lib/admin-session-cookie";
import { z } from "zod";

const loginBody = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(256),
});

const SESSION_MS = 8 * 60 * 60 * 1000;

export async function GET() {
  const jar = await cookies();
  const s = readAdminSession(jar.get(ADMIN_AUTH_COOKIE)?.value);
  if (!s) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}

export async function POST(req: Request) {
  if (!adminCredentialsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in web/local-secrets.env (see local-secrets.example.env).",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 422 });
  }

  if (!verifyAdminLogin(parsed.data.username, parsed.data.password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  let token: string;
  try {
    token = sealAdminSession(SESSION_MS);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const jar = await cookies();
  jar.set(ADMIN_AUTH_COOKIE, token, {
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
  jar.delete(ADMIN_AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
