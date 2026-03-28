"use client";

import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useId, useMemo, useState } from "react";
import { fetchAllBondingCurves } from "@/lib/accounts";
import { FilterPills, SearchInput } from "@/components/SearchPrimitives";

type Scope = "Projects" | "Services" | "Sections";

const SERVICES = [
  "Website Designers",
  "Front End Developers",
  "Full Stack Developers",
  "Raid Teams",
  "Marketing Managers",
  "KOL Managers",
  "Community Managers",
  "Discord Moderators",
  "Telegram Moderators",
  "X Moderators",
  "Brand Designers",
  "Smart Contract Auditors",
];

const SECTIONS = [
  { label: "Become a Service Provider", href: "/marketplace/apply" },
  { label: "Marketplace service search", href: "/marketplace?tab=search" },
  { label: "How marketplace hiring works", href: "/marketplace?tab=how" },
  { label: "Sample provider profiles", href: "/marketplace?tab=profiles" },
  { label: "Apply to Launch", href: "/launch" },
  { label: "Browse launched projects", href: "/traders#project-directory" },
  { label: "Contact", href: "/contact" },
];

type ProjectRow = { mint: string; name: string; symbol: string };

export function DiscoverySearchContent({
  placeholder,
  autoFocus,
  onNavigate,
  className = "",
}: {
  placeholder: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const { connection } = useConnection();
  const searchFieldId = useId();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("Projects");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const all = await fetchAllBondingCurves(connection);
        if (cancelled) return;
        setProjects(
          all.map(({ curve }) => ({
            mint: curve.mint.toBase58(),
            name: curve.name,
            symbol: curve.symbol,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const normalized = query.trim().toLowerCase();

  const projectResults = useMemo(
    () =>
      projects
        .filter((p) =>
          normalized
            ? p.mint.toLowerCase().includes(normalized) ||
              p.name.toLowerCase().includes(normalized) ||
              p.symbol.toLowerCase().includes(normalized)
            : true,
        )
        .slice(0, 8),
    [normalized, projects],
  );

  const serviceResults = useMemo(
    () =>
      SERVICES.filter((s) =>
        normalized ? s.toLowerCase().includes(normalized) : true,
      ).slice(0, 8),
    [normalized],
  );

  const sectionResults = useMemo(
    () =>
      SECTIONS.filter((s) =>
        normalized ? s.label.toLowerCase().includes(normalized) : true,
      ).slice(0, 8),
    [normalized],
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <label htmlFor={searchFieldId} className="sr-only">
        Search by contract address, name, ticker, service, or site section
      </label>
      <SearchInput
        id={searchFieldId}
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      <div role="group" aria-label="Search scope">
        <FilterPills
          value={scope}
          onChange={setScope}
          options={["Projects", "Services", "Sections"]}
        />
      </div>

      {scope === "Projects" ? (
        <div className="space-y-2">
          {loading ? (
            <p className="text-xs text-zinc-500">Scanning launched projects…</p>
          ) : projectResults.length === 0 ? (
            <p className="text-xs text-zinc-500">No project matches yet.</p>
          ) : (
            projectResults.map((row) => (
              <Link
                key={row.mint}
                href={`/coin/${row.mint}`}
                onClick={onNavigate}
                className="block rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 hover:border-white/20"
              >
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className="min-w-0">
                    {row.name} <span className="text-zinc-400">${row.symbol}</span>
                  </span>
                  <span className="shrink-0 break-all font-mono text-[11px] text-zinc-500 sm:max-w-[50%] sm:truncate sm:text-xs">
                    {row.mint}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : null}

      {scope === "Services" ? (
        <div className="space-y-2">
          {serviceResults.length === 0 ? (
            <p className="text-xs text-zinc-500">No service matches.</p>
          ) : (
            serviceResults.map((service) => (
              <Link
                key={service}
                href={`/marketplace?service=${encodeURIComponent(service)}`}
                onClick={onNavigate}
                className="block rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 hover:border-white/20"
              >
                {service}
              </Link>
            ))
          )}
        </div>
      ) : null}

      {scope === "Sections" ? (
        <div className="space-y-2">
          {sectionResults.length === 0 ? (
            <p className="text-xs text-zinc-500">No section matches.</p>
          ) : (
            sectionResults.map((section) => (
              <Link
                key={section.label}
                href={section.href}
                onClick={onNavigate}
                className="block rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 hover:border-white/20"
              >
                {section.label}
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
