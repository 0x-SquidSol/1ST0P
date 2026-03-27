import { type ReactNode } from "react";

export function PageHeader({
  label,
  title,
  description,
  right,
}: {
  label: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-[240px]">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-100">{title}</h1>
      </div>
      <div className="flex max-w-2xl flex-col items-start gap-3">
        {description ? (
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
        ) : null}
        {right}
      </div>
    </div>
  );
}

