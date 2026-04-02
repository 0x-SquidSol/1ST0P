"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { shortenWallet } from "@/lib/marketplace-reviews";

type ReviewStatus = "pending" | "needs_info" | "approved" | "rejected";

type AppRow = {
  id: string;
  submittedAt: string;
  reviewStatus: ReviewStatus;
  publicSlug?: string;
  approvedAt?: string;
  displayName: string;
  headline: string;
  applicantWallet: string;
};

type DealRow = {
  id: string;
  providerDisplayName: string;
  providerSlug: string;
  serviceName: string;
  buyerWallet: string;
  providerWallet: string;
  status: string;
  serviceType: string;
  totalSol: number;
  agreementSigned: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [credentialsConfigured, setCredentialsConfigured] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [tab, setTab] = useState<"applications" | "contracts">("applications");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const refreshApps = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch("/api/admin/applications", { credentials: "include" });
    if (res.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!res.ok) {
      setLoadErr("Could not load applications.");
      return;
    }
    const data = (await res.json()) as { applications: AppRow[] };
    setApps(data.applications);
  }, []);

  const refreshDeals = useCallback(async () => {
    const res = await fetch("/api/admin/deals", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { deals: DealRow[] };
    setDeals(data.deals);
  }, []);

  useEffect(() => {
    void (async () => {
      const cfg = await fetch("/api/admin/config");
      const c = (await cfg.json()) as { credentialsConfigured: boolean };
      setCredentialsConfigured(c.credentialsConfigured);

      const s = await fetch("/api/admin/session", { credentials: "include" });
      setAuthenticated(s.ok);
      setAuthChecked(true);
      if (s.ok) {
        await refreshApps();
        await refreshDeals();
      }
    })();
  }, [refreshApps, refreshDeals]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setLoginErr(data.error ?? "Login failed.");
        return;
      }
      setPassword("");
      setAuthenticated(true);
    } finally {
      setBusy(false);
    }
    void refreshApps();
  }

  async function logout() {
    await fetch("/api/admin/session", {
      method: "DELETE",
      credentials: "include",
    });
    setAuthenticated(false);
    setApps([]);
  }

  async function runAction(
    id: string,
    action: "approve" | "reject" | "needs_info" | "pending",
  ) {
    setActionId(id);
    setLoadErr(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slug?: string;
      };
      if (!res.ok) {
        setLoadErr(data.error ?? "Action failed.");
        return;
      }
      await refreshApps();
    } finally {
      setActionId(null);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
        <p className="text-center text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              Staff
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Admin sign in</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Use the username and password from{" "}
              <code className="rounded bg-zinc-900 px-1 text-zinc-400">
                web/local-secrets.env
              </code>{" "}
              (<span className="text-zinc-400">ADMIN_USERNAME</span>,{" "}
              <span className="text-zinc-400">ADMIN_PASSWORD</span>). That file
              is gitignored. If you can’t see it in search, open{" "}
              <code className="text-zinc-400">local-secrets.example.env</code> in
              the same folder — your real file is named{" "}
              <code className="text-zinc-400">local-secrets.env</code>.
            </p>
            {!credentialsConfigured ? (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200/90">
                Admin credentials are not set. Create{" "}
                <code className="text-xs">web/local-secrets.env</code> (copy{" "}
                <code className="text-xs">local-secrets.example.env</code>) with{" "}
                <code className="text-xs">ADMIN_USERNAME</code> and{" "}
                <code className="text-xs">ADMIN_PASSWORD</code>, restart{" "}
                <code className="text-xs">npm run dev</code>, then try again.
              </p>
            ) : null}
          </div>
          <form
            onSubmit={(e) => void login(e)}
            className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-6"
          >
            <label className="block text-sm text-zinc-400">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
              <span className="mt-1 block text-xs text-zinc-600">
                Must match <code className="text-zinc-500">local-secrets.env</code> exactly
                (watch <code className="text-zinc-500">0</code> vs letter{" "}
                <code className="text-zinc-500">O</code>).
              </span>
            </label>
            <label className="block text-sm text-zinc-400">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !username.trim() || !password}
              className="w-full rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {loginErr ? (
              <p className="text-sm text-red-400">{loginErr}</p>
            ) : null}
          </form>
          <p className="text-center text-xs text-zinc-600">
            <Link href="/" className="underline underline-offset-4 hover:text-zinc-400">
              ← Back to site
            </Link>
          </p>
        </div>
      </div>
    );
  }

  function dealStatusColor(s: string): string {
    if (s === "active") return "bg-emerald-500/15 text-emerald-200";
    if (s === "completed") return "bg-emerald-500/25 text-emerald-100";
    if (s === "agreement_pending") return "bg-amber-500/15 text-amber-200";
    if (s === "disputed") return "bg-red-500/15 text-red-200";
    if (s === "declined") return "bg-red-500/10 text-red-300";
    return "bg-zinc-500/15 text-zinc-300";
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              Staff
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Provider applications and marketplace contracts. Data is in-memory until you add a database.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshApps();
                void refreshDeals();
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-zinc-900/40 p-1">
          <button
            type="button"
            onClick={() => setTab("applications")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "applications"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Applications ({apps.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("contracts")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "contracts"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Contracts ({deals.length})
          </button>
        </div>

        {loadErr ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {loadErr}
          </p>
        ) : null}

        {/* ── Applications tab ── */}
        {tab === "applications" ? (
          <>
            {apps.length === 0 ? (
              <p className="text-sm text-zinc-500">No applications in the queue yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="p-3 font-medium">Submitted</th>
                      <th className="p-3 font-medium">Listing</th>
                      <th className="p-3 font-medium">Wallet</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-white/[0.06] align-top hover:bg-zinc-900/20"
                      >
                        <td className="p-3 text-xs text-zinc-500">
                          {new Date(a.submittedAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-zinc-200">{a.displayName}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                            {a.headline}
                          </div>
                          {a.publicSlug ? (
                            <Link
                              href={`/marketplace/providers/${a.publicSlug}`}
                              className="mt-2 inline-block text-xs text-violet-400 underline underline-offset-2 hover:text-violet-300"
                            >
                              View public profile →
                            </Link>
                          ) : null}
                        </td>
                        <td className="p-3 font-mono text-xs text-zinc-500">
                          {shortenWallet(a.applicantWallet, 6)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-xs ${
                              a.reviewStatus === "approved"
                                ? "bg-emerald-500/15 text-emerald-200"
                                : a.reviewStatus === "rejected"
                                  ? "bg-red-500/15 text-red-200/90"
                                  : a.reviewStatus === "needs_info"
                                    ? "bg-amber-500/15 text-amber-200/90"
                                    : "bg-zinc-500/15 text-zinc-300"
                            }`}
                          >
                            {a.reviewStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              disabled={actionId === a.id || a.reviewStatus === "approved"}
                              onClick={() => void runAction(a.id, "approve")}
                              className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 disabled:opacity-40"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionId === a.id}
                              onClick={() => void runAction(a.id, "needs_info")}
                              className="rounded border border-amber-500/25 px-2 py-1 text-xs text-amber-200/90 disabled:opacity-40"
                            >
                              Needs info
                            </button>
                            <button
                              type="button"
                              disabled={actionId === a.id}
                              onClick={() => void runAction(a.id, "pending")}
                              className="rounded border border-white/10 px-2 py-1 text-xs text-zinc-400 disabled:opacity-40"
                            >
                              Mark pending
                            </button>
                            <button
                              type="button"
                              disabled={actionId === a.id}
                              onClick={() => void runAction(a.id, "reject")}
                              className="rounded border border-red-500/25 bg-red-500/10 px-2 py-1 text-xs text-red-200/90 disabled:opacity-40"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {/* ── Contracts tab ── */}
        {tab === "contracts" ? (
          <>
            {deals.length === 0 ? (
              <p className="text-sm text-zinc-500">No contracts yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="p-3 font-medium">Created</th>
                      <th className="p-3 font-medium">Contract</th>
                      <th className="p-3 font-medium">Provider</th>
                      <th className="p-3 font-medium">Buyer</th>
                      <th className="p-3 font-medium">SOL</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Agreement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-white/[0.06] align-top hover:bg-zinc-900/20"
                      >
                        <td className="p-3 text-xs text-zinc-500">
                          {new Date(d.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-zinc-200">
                            {d.serviceType}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500">
                            {d.serviceName}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-zinc-300">
                            {d.providerDisplayName}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-600">
                            {d.providerWallet}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs text-zinc-500">
                          {d.buyerWallet}
                        </td>
                        <td className="p-3 text-xs text-zinc-300">
                          {d.totalSol.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-xs ${dealStatusColor(d.status)}`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          {d.agreementSigned ? (
                            <span className="text-emerald-400">Signed</span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        <p className="text-center text-xs text-zinc-600">
          <Link href="/" className="underline underline-offset-4 hover:text-zinc-400">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
