import fs from "node:fs";
import path from "node:path";
import { config as loadEnvFile } from "dotenv";

/**
 * API routes don't always inherit env from next.config.ts evaluation.
 * Load `local-secrets.env` synchronously before reading ADMIN_* (same paths as next.config).
 */
let attempted = false;

export function loadLocalSecretsIntoEnv(): void {
  if (attempted) return;
  attempted = true;
  const candidates = [
    path.join(process.cwd(), "local-secrets.env"),
    path.join(process.cwd(), "web", "local-secrets.env"),
  ];
  for (const secretsPath of candidates) {
    if (fs.existsSync(secretsPath)) {
      loadEnvFile({ path: secretsPath, quiet: true, override: true });
      break;
    }
  }
}
