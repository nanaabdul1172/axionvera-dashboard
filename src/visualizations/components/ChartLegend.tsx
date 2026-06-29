/**
 * @module visualizations/components/ChartLegend
 *
 * Theme-aware legend formatter for Recharts legends.
 */

import React from "react";
import { useChartTheme } from "../hooks/useChartTheme";

export interface ChartLegendProps {
  value?: string;
  className?: string;
}

export function ChartLegend({ value, className = "" }: ChartLegendProps) {
  const theme = useChartTheme();
  return (
    <span className={`text-sm ${className}`} style={{ color: theme.foreground }}>
      {value}
    </span>
  );
}
