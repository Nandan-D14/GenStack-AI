import { HTMLAttributes } from "react";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  default: "border-gs-border bg-gs-surface-2 text-gs-secondary",
  accent: "border-gs-accent/30 bg-gs-accent-soft text-gs-accent-text",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-400",
};

export function Chip({
  className = "",
  tone = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
