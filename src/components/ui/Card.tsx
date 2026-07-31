import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  className = "",
  hover = false,
  padding = "md",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-gs-surface-2 border border-gs-border rounded-lg shadow-gs-sm ${
        hover ? "transition-colors hover:border-gs-border-strong hover:bg-gs-surface-3" : ""
      } ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
