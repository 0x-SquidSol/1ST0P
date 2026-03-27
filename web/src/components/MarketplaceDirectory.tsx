"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterPills, SearchInput } from "@/components/SearchPrimitives";

type Scope = "All" | "Development" | "Growth" | "Community";

const SERVICES = [
  { name: "Website Designers", group: "Development" as Scope },
  { name: "Front End Developers", group: "Development" as Scope },
  { name: "Full Stack Developers", group: "Development" as Scope },
  { name: "Smart Contract Engineers", group: "Development" as Scope },
  { name: "Smart Contract Auditors", group: "Development" as Scope },
  { name: "Raid Teams", group: "Growth" as Scope },
  { name: "Marketing Managers", group: "Growth" as Scope },
  { name: "KOL Managers", group: "Growth" as Scope },
  { name: "Brand Designers", group: "Growth" as Scope },
  { name: "Community Managers", group: "Community" as Scope },
  { name: "Discord Moderators", group: "Community" as Scope },
  { name: "Telegram Moderators", group: "Community" as Scope },
  { name: "X Moderators", group: "Community" as Scope },
];

export function MarketplaceDirectory() {
  const params = useSearchParams();
  const seedQuery = params.get("service") ?? "";
  const [query, setQuery] = useState(seedQuery);
  const [scope, setScope] = useState<Scope>("All");
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      SERVICES.filter((s) => (scope === "All" ? true : s.group === scope)).filter(
        (s) => (normalized ? s.name.toLowerCase().includes(normalized) : true),
      ),
    [normalized, scope],
  );

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/35 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Service Search
      </p>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search service types (e.g. Front End Developers, KOL Managers)"
      />
      <FilterPills
        value={scope}
        onChange={setScope}
        options={["All", "Development", "Growth", "Community"]}
      />
      <div className="grid gap-2 md:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-500">No matching service categories.</p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200"
            >
              {s.name}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

