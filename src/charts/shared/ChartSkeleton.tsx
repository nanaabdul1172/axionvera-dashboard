import React from "react";
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  height?: number;
  className?: string;
}

export function ChartSkeleton({ height = 300, className }: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className={cn("w-full animate-pulse rounded-lg", className)}
      style={{ height }}
    >
      <span className="sr-only">Loading chart…</span>
      <div className="flex h-full flex-col gap-2 p-3">
        {/* Y-axis + bars area */}
        <div className="flex flex-1 gap-2">
          <div className="w-10 rounded bg-[var(--color-bg-tertiary)]" />
          <div className="flex flex-1 flex-col justify-between gap-1">
            {[0.8, 0.5, 0.65, 0.4, 0.7].map((opacity, i) => (
              <div
                key={i}
                className="rounded bg-[var(--color-bg-tertiary)]"
                style={{ flex: 1, opacity }}
              />
            ))}
          </div>
        </div>
        {/* X-axis label row */}
        <div className="flex gap-4 pl-12">
          {[40, 32, 48, 36, 44].map((w, i) => (
            <div
              key={i}
              className="h-2 rounded bg-[var(--color-bg-tertiary)]"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
