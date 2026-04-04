import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_AUTH_COOKIE = "1st0p_admin";

export type AdminSessionPayload = {
  role: "admin";
  exp: number;
};

function signingSecret(): string {
  const a = process.env.ADMIN_SESSION_SECRET?.trim();
  if (a && a.length >= 16) return a;
  const m = process.env.MESSAGES_SESSION_SECRET?.trim();
  if (m && m.length >= 16) return m;
  if (process.env.NODE_ENV === "development") {
    return "__dev_only_admin_signing_secret__";
  }
  throw new Error(
    "Set ADMIN_SESSION_SECRET or MESSAGES_SESSION_SECRET (≥16 chars) in environment variables.",
  );
}

function seal(json: string): string {
  const sig = createHmac("sha256", signingSecret())
    .update(json)
    .digest("base64url");
  return `${Buffer.from(json, "utf8").toString("base64url")}.${sig}`;
}

function unseal(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const b64 = token.slice(0, i);
  const sig = token.slice(i + 1);
  let json: string;
  try {
    json = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = createHmac("sha256", signingSecret())
    .update(json)
    .digest("base64url");
  try {
    if (
      !timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return json;
}

export function sealAdminSession(maxAgeMs: number): string {
  const exp = Date.now() + maxAgeMs;
  return seal(JSON.stringify({ role: "admin" as const, exp } satisfies AdminSessionPayload));
}

export function readAdminSession(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const json = unseal(token);
  if (!json) return null;
  try {
    const p = JSON.parse(json) as AdminSessionPayload;
    if (p.role !== "admin" || typeof p.exp !== "number" || Date.now() > p.exp) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}
