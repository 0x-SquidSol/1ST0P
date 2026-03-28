"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { DiscoverySearchContent } from "@/components/GlobalDiscoverySearch";

const PLACEHOLDER = "Search CA, name, ticker, service type or section";

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-[max(2.5rem,env(safe-area-inset-top))] backdrop-blur-sm sm:p-4 sm:pt-[12vh]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="global-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mb-4 w-full max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-bottom)-1.5rem))] max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="text-xs font-normal uppercase tracking-[0.2em] text-zinc-500"
          >
            Search
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-100"
            aria-label="Close search"
          >
            Close
          </button>
        </div>
        <DiscoverySearchContent
          placeholder={PLACEHOLDER}
          autoFocus
          onNavigate={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}
