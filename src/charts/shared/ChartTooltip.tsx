import React from "react";
import { cn } from "@/lib/utils";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  formatter?: (value: number | string, name?: string) => [string, string] | string;
  labelFormatter?: (label: string) => string;
  className?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const displayLabel = label && labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 shadow-xl text-xs",
        "bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]",
        className
      )}
    >
      {displayLabel && (
        <p className="mb-1.5 text-[var(--color-text-muted)]">{displayLabel}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const raw = entry.value ?? 0;
          let displayValue: string;
          let displayName: string = entry.name ?? entry.dataKey ?? "";

          if (formatter) {
            const result = formatter(raw, entry.name);
            if (Array.isArray(result)) {
              [displayValue, displayName] = result;
            } else {
              displayValue = result;
            }
          } else {
            displayValue = typeof raw === "number" ? raw.toLocaleString() : String(raw);
          }

          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                {entry.color && (
                  <span
                    className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                )}
                {displayName}
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
