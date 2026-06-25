import { forwardRef, type TextareaHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className, required, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <Label htmlFor={textareaId} required={required} error={!!error}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full resize-none rounded-xl border px-4 py-3 text-sm text-text-primary",
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
            <p className="text-xs text-text-muted">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
