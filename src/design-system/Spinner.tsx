import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

interface SpinnerProps extends HTMLAttributes<SVGSVGElement> {
  size?: SpinnerSize;
  label?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Spinner({ size = "md", label = "Loading…", className, ...props }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin", sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={label}
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
