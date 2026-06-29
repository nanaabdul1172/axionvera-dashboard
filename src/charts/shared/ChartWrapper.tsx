import React from "react";
import { cn } from "@/lib/utils";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import { ChartEmptyState } from "./ChartEmptyState";

interface ChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  height?: number;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export function ChartWrapper({
  children,
  title,
  description,
  isLoading = false,
  isEmpty = false,
  error = null,
  height = 300,
  emptyMessage = "No data available",
  onRetry,
  className,
}: ChartWrapperProps) {
  const ariaLabel = [title, description].filter(Boolean).join(": ") || "Chart";

  if (isLoading) {
    return <ChartSkeleton height={height} className={className} />;
  }

  if (isEmpty) {
    return (
      <ChartEmptyState
        message={emptyMessage}
        height={height}
        className={className}
      />
    );
  }

  return (
    <ChartErrorBoundary
      chartTitle={title}
      onRetry={onRetry}
      className={className}
    >
      <div
        role="img"
        aria-label={ariaLabel}
        className={cn("w-full", className)}
      >
        {children}
        {description && (
          <span className="sr-only">{description}</span>
        )}
      </div>
    </ChartErrorBoundary>
  );
}
