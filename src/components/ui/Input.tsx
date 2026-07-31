"use client";

import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border border-gs-border bg-gs-bg px-3 py-2 text-sm text-gs-text placeholder:text-gs-muted transition-colors focus:border-gs-accent/50 focus:outline-none focus:ring-1 focus:ring-gs-accent/40 ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";
