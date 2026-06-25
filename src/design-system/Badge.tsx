import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "active"
  | "passed"
  | "rejected"
  | "executed"
  | "cancelled"
  | "pending";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  default:   "border-border-primary bg-background-secondary/30 text-text-primary",
  pending:   "border-border-primary bg-background-secondary/30 text-text-primary",
  success:   "border-emerald-900/50 bg-emerald-950/30 text-emerald-200",
  error:     "border-rose-900/50 bg-rose-950/30 text-rose-200",
  warning:   "border-amber-900/50 bg-amber-950/30 text-amber-200",
  info:      "border-axion-500/50 bg-axion-950/20 text-axion-300",
  active:    "border-axion-500/50 bg-axion-950/20 text-axion-300",
  passed:    "border-emerald-500/50 bg-emerald-950/20 text-emerald-300",
  rejected:  "border-rose-500/50 bg-rose-950/20 text-rose-300",
  executed:  "border-violet-500/50 bg-violet-950/20 text-violet-300",
  cancelled: "border-amber-500/50 bg-amber-950/20 text-amber-300",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variantMap[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
