/**
 * @module visualizations/components/EmptyState
 *
 * Consistent empty-state placeholder for charts.
 */

import React from "react";
import { useChartTheme } from "../hooks/useChartTheme";

export interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  message = "No data available",
  icon,
  className = "",
}: EmptyStateProps) {
  const theme = useChartTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border p-8 ${className}`}
      style={{ borderColor: theme.border, background: theme.background, color: theme.muted }}
      role="status"
      aria-live="polite"
    >
      {icon && <div className="mb-3 opacity-60">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}
