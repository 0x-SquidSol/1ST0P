"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import bs58 from "bs58";
import { loginMessageText } from "@/lib/verify-wallet-sign-message";
import { UsernameClaimModal } from "@/components/UsernameClaimModal";
import { getCachedUsername, setCachedUsername } from "@/lib/username-cache";

/**
 * Site-wide gate: when a wallet connects and has no cached username,
 * prompt the claim modal. Uses localStorage as primary source of truth
 * (Vercel /tmp is ephemeral). Only shows once per wallet ever.
 */
export function UsernameGate({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [needsClaim, setNeedsClaim] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const check = useCallback(async () => {
    if (!connected || !publicKey) {
      setNeedsClaim(false);
      return;
    }

    const wallet = publicKey.toBase58();

    // Check localStorage first — if cached, done
    if (getCachedUsername(wallet)) {
      setNeedsClaim(false);
      return;
    }

    // No local cache — need a session to check server
    if (!signMessage) return;

    try {
      const checkSession = await fetch("/api/messages/threads", { credentials: "include" });
      if (!checkSession.ok) {
        const nRes = await fetch("/api/messages/nonce");
        if (!nRes.ok) return;
        const { nonce } = (await nRes.json()) as { nonce: string };
        const message = loginMessageText(wallet, nonce);
        const sig = await signMessage(new TextEncoder().encode(message));
        const sRes = await fetch("/api/messages/session", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, message, signature: bs58.encode(sig) }),
        });
        if (!sRes.ok) return;
      }
      setSessionReady(true);

      // Check server (might have username from /tmp if warm)
      const res = await fetch("/api/profile/username", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { username: string | null };
        if (data.username) {
          // Server knows it — cache locally and we're done
          setCachedUsername(wallet, data.username);
          setNeedsClaim(false);
          return;
        }
      }

      // No username anywhere — show claim modal
      setNeedsClaim(true);
    } catch {
      // Network error — don't block the user
    }
  }, [connected, publicKey, signMessage]);

  useEffect(() => {
    if (connected && publicKey) {
      void check();
    }
    if (!connected) {
      setNeedsClaim(false);
      setSessionReady(false);
    }
  }, [connected, publicKey, check]);

  return (
    <>
      {children}
      {needsClaim && sessionReady && (
        <UsernameClaimModal
          required
          onClaimed={(username) => {
            if (publicKey) {
              setCachedUsername(publicKey.toBase58(), username);
            }
            setNeedsClaim(false);
          }}
        />
      )}
    </>
  );
}
