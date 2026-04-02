"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { loginMessageText } from "@/lib/verify-wallet-sign-message";
import { PageHeader } from "@/components/PageHeader";

export default function HireProviderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const serviceName = searchParams.get("service") ?? "";

  const { publicKey, signMessage, connected } = useWallet();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  async function ensureSession(): Promise<boolean> {
    const check = await fetch("/api/messages/threads", { credentials: "include" });
    if (check.ok) return true;
    if (!publicKey || !signMessage) {
      setErr("Connect a wallet with sign-message support to start a deal.");
      return false;
    }
    const wallet = publicKey.toBase58();
    const nRes = await fetch("/api/messages/nonce");
    if (!nRes.ok) { setErr("Could not get sign-in nonce."); return false; }
    const { nonce } = (await nRes.json()) as { nonce: string };
    const message = loginMessageText(wallet, nonce);
    const sig = await signMessage(new TextEncoder().encode(message));
    const sRes = await fetch("/api/messages/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, message, signature: bs58.encode(sig) }),
    });
    if (!sRes.ok) {
      const j = (await sRes.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Wallet sign-in failed.");
      return false;
    }
    return true;
  }

  async function startDeal() {
    if (!slug || !serviceName) { setErr("Missing provider or service."); return; }
    setBusy(true);
    setErr(null);
    try {
      const ok = await ensureSession();
      if (!ok) return;
      const res = await fetch("/api/marketplace/deals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerSlug: slug, serviceName }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Could not start deal.");
        return;
      }
      const data = (await res.json()) as { deal: { id: string } };
      router.push(`/marketplace/deals/${data.deal.id}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  // Auto-start if wallet is connected
  useEffect(() => {
    if (connected && publicKey && slug && serviceName && !autoStarted && !busy) {
      setAutoStarted(true);
      void startDeal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, slug, serviceName]);

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <section className="polish-surface-page max-w-full min-w-0 rounded-3xl bg-zinc-950/52 p-4 sm:p-6 md:p-8">
        <PageHeader
          label="Marketplace"
          title="Starting deal chat…"
          description="Connecting you with the provider. You'll discuss terms and draft an agreement together."
        />
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/marketplace/providers/${slug}`}
            className="text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-zinc-200"
          >
            ← Back to provider profile
          </Link>
          <Link
            href="/marketplace/deals"
            className="text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-300"
          >
            My deal chats
          </Link>
        </div>
      </section>

      <section className="polish-section rounded-3xl bg-zinc-950/38 p-4 sm:p-6">
        {busy ? (
          <p className="text-sm text-zinc-400">Creating deal chat…</p>
        ) : !connected ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Connect your wallet in the header to start a deal chat.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {!autoStarted && (
              <button
                type="button"
                onClick={() => void startDeal()}
                disabled={busy}
                className="rounded-lg border border-white/20 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
              >
                Start deal chat
              </button>
            )}
          </div>
        )}
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      </section>
    </div>
  );
}
