import { createHmac, timingSafeEqual } from "crypto";

export const APPLICANT_SESSION_COOKIE = "1st0p_msg_applicant";
export const OPERATOR_SESSION_COOKIE = "1st0p_msg_operator";

export type ApplicantSessionPayload = {
  wallet: string;
  exp: number;
};

export type OperatorSessionPayload = {
  role: "operator";
  exp: number;
};

function sessionSecret(): string {
  const s = process.env.MESSAGES_SESSION_SECRET?.trim();
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "dev-messages-session-secret-min-16-chars";
  }
  throw new Error("MESSAGES_SESSION_SECRET is required in production");
}

function seal(json: string): string {
  const sig = createHmac("sha256", sessionSecret())
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
  const expected = createHmac("sha256", sessionSecret())
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

export function sealApplicantSession(wallet: string, maxAgeMs: number): string {
  const exp = Date.now() + maxAgeMs;
  const payload: ApplicantSessionPayload = { wallet, exp };
  return seal(JSON.stringify(payload));
}

export function readApplicantSession(
  token: string | undefined,
): ApplicantSessionPayload | null {
  if (!token) return null;
  const json = unseal(token);
  if (!json) return null;
  try {
    const p = JSON.parse(json) as ApplicantSessionPayload;
    if (
      typeof p.wallet !== "string" ||
      typeof p.exp !== "number" ||
      Date.now() > p.exp
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function sealOperatorSession(maxAgeMs: number): string {
  const exp = Date.now() + maxAgeMs;
  const payload: OperatorSessionPayload = { role: "operator", exp };
  return seal(JSON.stringify(payload));
}

export function readOperatorSession(
  token: string | undefined,
): OperatorSessionPayload | null {
  if (!token) return null;
  const json = unseal(token);
  if (!json) return null;
  try {
    const p = JSON.parse(json) as OperatorSessionPayload;
    if (p.role !== "operator" || typeof p.exp !== "number" || Date.now() > p.exp) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function operatorSecretOk(secret: string): boolean {
  const expected = process.env.MESSAGES_OPERATOR_SECRET?.trim();
  if (expected && expected.length >= 8) {
    return timingSafeEqual(
      Buffer.from(secret, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  }
  if (process.env.NODE_ENV === "development") {
    return secret === "dev-operator";
  }
  return false;
}
