"use client";

export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-white/25"
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
          className={`rounded-lg border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
            value === option
              ? "border-white/20 bg-zinc-800/80 text-zinc-100"
              : "border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

