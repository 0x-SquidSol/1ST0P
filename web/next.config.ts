import type { NextConfig } from "next";

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
