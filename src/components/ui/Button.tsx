"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-gs-accent text-white hover:bg-gs-accent-hover border border-transparent",
  secondary:
    "bg-gs-surface-2 text-gs-text border border-gs-border hover:bg-gs-hover hover:border-gs-border-strong",
  ghost: "bg-transparent text-gs-secondary hover:text-gs-text hover:bg-gs-surface-2 border border-transparent",
  danger: "bg-gs-danger/15 text-gs-danger border border-gs-danger/30 hover:bg-gs-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-5 text-sm rounded-md",
  icon: "h-8 w-8 rounded-md",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
