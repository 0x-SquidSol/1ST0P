import fs from "node:fs";
import path from "node:path";
import { config as loadEnvFile } from "dotenv";
import type { NextConfig } from "next";

// Searchable env file (gitignored). See `local-secrets.example.env`. Loads from `web/` even if `cwd` is repo root.
const localSecretsCandidates = [
  path.join(process.cwd(), "local-secrets.env"),
  path.join(process.cwd(), "web", "local-secrets.env"),
];
for (const secretsPath of localSecretsCandidates) {
  if (fs.existsSync(secretsPath)) {
    loadEnvFile({ path: secretsPath, quiet: true });
    break;
  }
}

const nextConfig: NextConfig = {
  // Smaller server traces / bundles on Vercel (heavy Solana stack)
  serverExternalPackages: [
    "@coral-xyz/anchor",
    "@solana/spl-token",
    "@solana/web3.js",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
