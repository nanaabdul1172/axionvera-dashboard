import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, error, className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-medium",
        error ? "text-red-500 dark:text-red-400" : "text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <>
          <span className="ml-1 text-red-500 dark:text-red-400" aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </>
      )}
    </label>
  )
);

Label.displayName = "Label";
