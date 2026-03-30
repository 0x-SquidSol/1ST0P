import { timingSafeEqual } from "crypto";
import { loadLocalSecretsIntoEnv } from "@/lib/load-local-secrets";

/**
 * Admin dashboard login at /admin.
 * Set ADMIN_USERNAME and ADMIN_PASSWORD in web/local-secrets.env (gitignored).
 */

export function adminCredentialsConfigured(): boolean {
  loadLocalSecretsIntoEnv();
  const u = process.env.ADMIN_USERNAME?.trim();
  const p = process.env.ADMIN_PASSWORD?.trim();
  return Boolean(u && p);
}

export function verifyAdminLogin(username: string, password: string): boolean {
  loadLocalSecretsIntoEnv();
  const eu = process.env.ADMIN_USERNAME?.trim();
  const ep = process.env.ADMIN_PASSWORD?.trim();
  if (!eu || !ep) return false;

  try {
    const uOk =
      username.length === eu.length &&
      timingSafeEqual(Buffer.from(username, "utf8"), Buffer.from(eu, "utf8"));
    const pOk =
      password.length === ep.length &&
      timingSafeEqual(Buffer.from(password, "utf8"), Buffer.from(ep, "utf8"));
    return uOk && pOk;
  } catch {
    return false;
  }
}
