"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import bs58 from "bs58";
import { loginMessageText } from "@/lib/verify-wallet-sign-message";
import { UsernameClaimModal } from "@/components/UsernameClaimModal";

/**
 * Site-wide gate: when a wallet connects for the first time and has no
 * username, show the claim modal. Runs on every page inside WalletProviders.
 */
export function UsernameGate({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [needsClaim, setNeedsClaim] = useState(false);
  const [checked, setChecked] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const checkUsername = useCallback(async () => {
    if (!connected || !publicKey) {
      setNeedsClaim(false);
      setChecked(false);
      return;
    }

    // Ensure session exists (sign in if needed)
    const checkSession = await fetch("/api/messages/threads", { credentials: "include" });
    if (!checkSession.ok) {
      if (!signMessage) {
        // Wallet doesn't support sign message — skip silently
        setChecked(true);
        return;
      }
      try {
        const wallet = publicKey.toBase58();
        const nRes = await fetch("/api/messages/nonce");
        if (!nRes.ok) { setChecked(true); return; }
        const { nonce } = (await nRes.json()) as { nonce: string };
        const message = loginMessageText(wallet, nonce);
        const sig = await signMessage(new TextEncoder().encode(message));
        const sRes = await fetch("/api/messages/session", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, message, signature: bs58.encode(sig) }),
        });
        if (!sRes.ok) { setChecked(true); return; }
      } catch {
        setChecked(true);
        return;
      }
    }
    setSessionReady(true);

    // Check if wallet has a username
    const res = await fetch("/api/profile/username", { credentials: "include" });
    if (!res.ok) { setChecked(true); return; }
    const data = (await res.json()) as { username: string | null };
    if (!data.username) {
      setNeedsClaim(true);
    }
    setChecked(true);
  }, [connected, publicKey, signMessage]);

  useEffect(() => {
    if (connected && publicKey && !checked) {
      void checkUsername();
    }
    if (!connected) {
      setNeedsClaim(false);
      setChecked(false);
      setSessionReady(false);
    }
  }, [connected, publicKey, checked, checkUsername]);

  return (
    <>
      {children}
      {needsClaim && sessionReady && (
        <UsernameClaimModal
          required
          onClaimed={() => setNeedsClaim(false)}
        />
      )}
    </>
  );
}
