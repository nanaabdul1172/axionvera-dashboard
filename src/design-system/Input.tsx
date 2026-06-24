import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [error ? errorId : null, helperText && !error ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <Label htmlFor={inputId} required={required} error={!!error}>
            {label}
          </Label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm text-text-primary",
            "bg-background-secondary/30 placeholder:text-text-muted",
            "transition-all duration-[--duration-base]",
            "focus:outline-none focus:ring-2 focus:ring-axion-500/50 focus:border-axion-500",
            error
              ? "border-red-500/70 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20"
              : "border-border-primary",
            className
          )}
          {...props}
        />
        <div className="min-h-[1.25rem]">
          {error ? (
            <p id={errorId} className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
          ) : helperText ? (
            <p id={helperId} className="text-xs text-text-muted">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
