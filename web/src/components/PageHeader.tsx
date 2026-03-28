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
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
          {title}
        </h1>
      </div>
      <div className="flex min-w-0 max-w-2xl flex-col items-start gap-3">
        {description ? (
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
        ) : null}
        {right}
      </div>
    </header>
  );
}

