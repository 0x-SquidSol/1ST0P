"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { type ReactNode, useMemo } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

/** Solana Connection rejects empty or scheme-less URLs (common when Vercel env is set but blank). */
function connectionEndpointFromEnv(
  raw: string | undefined,
  net: WalletAdapterNetwork,
): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return clusterApiUrl(net);
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const network = WalletAdapterNetwork.Devnet;
const endpoint = connectionEndpointFromEnv(process.env.NEXT_PUBLIC_RPC, network);

export function WalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter({ network })],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
