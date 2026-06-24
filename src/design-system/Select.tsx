import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, className, required, children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <Label htmlFor={selectId} required={required} error={!!error}>
            {label}
          </Label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "rounded-lg border border-border-primary bg-background-secondary/30",
            "px-3 py-1.5 text-xs text-text-primary",
            "outline-none transition hover:bg-background-secondary/60",
            "focus:border-axion-500 focus-visible:ring-2 focus-visible:ring-axion-500/50",
            error && "border-red-500/70",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
