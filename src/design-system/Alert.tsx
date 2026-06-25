import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "error" | "warning";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  live?: "polite" | "assertive" | "off";
}

const variantMap: Record<AlertVariant, string> = {
  info:    "border-border-primary bg-background-secondary/30 text-text-primary",
  success: "border-emerald-900/50 bg-emerald-950/30 text-emerald-200",
  error:   "border-rose-900/50 bg-rose-950/30 text-rose-200",
  warning: "border-amber-900/50 bg-amber-950/30 text-amber-200",
};

const roleMap: Record<AlertVariant, "status" | "alert"> = {
  info:    "status",
  success: "status",
  error:   "alert",
  warning: "alert",
};

export function Alert({ variant = "info", title, live, className, children, ...props }: AlertProps) {
  const role = roleMap[variant];
  const ariaLive = live ?? (role === "alert" ? "assertive" : "polite");

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cn("rounded-xl border px-4 py-3 text-sm", variantMap[variant], className)}
      {...props}
    >
      {title && <div className="font-medium">{title}</div>}
      {children && <div className={cn(title ? "mt-1 text-xs opacity-90" : "")}>{children}</div>}
    </div>
  );
}
