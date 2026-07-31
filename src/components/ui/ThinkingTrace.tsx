"use client";

import { useState, ReactNode } from "react";

export function ThinkingTrace({
  title = "Thinking",
  children,
  defaultOpen = true,
}: {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-gs-border bg-gs-surface overflow-hidden animate-gs-fade-in">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gs-secondary hover:text-gs-text transition-colors"
      >
        <span className="material-symbols-outlined text-[14px] text-gs-accent">psychology</span>
        <span className="flex-1">{title}</span>
        <span className="material-symbols-outlined text-[14px]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && (
        <div className="border-t border-gs-border px-3 py-2.5 text-xs text-gs-secondary font-mono leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
