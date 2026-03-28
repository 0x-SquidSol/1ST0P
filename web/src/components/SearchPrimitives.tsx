"use client";

export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  id,
  onFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  id?: string;
  onFocus?: () => void;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-white/25 sm:text-sm"
    />
  );
}

export function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
            value === option
              ? "border-white/25 bg-zinc-800/90 text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10"
              : "border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

