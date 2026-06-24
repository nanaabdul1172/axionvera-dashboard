import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonVariant = "default" | "ghost" | "danger";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

const sizeMap: Record<IconButtonSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const variantMap: Record<IconButtonVariant, string> = {
  default:
    "border border-border-primary bg-background-secondary/30 text-text-secondary hover:bg-background-secondary/60",
  ghost:
    "text-text-muted hover:text-text-primary hover:bg-background-secondary/60",
  danger:
    "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "md", variant = "default", className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-60",
        sizeMap[size],
        variantMap[variant],
        className
      )}
      {...props}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
);

IconButton.displayName = "IconButton";
