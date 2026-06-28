/**
 * @module visualizations/components/ChartTooltip
 *
 * Theme-aware tooltip content factory for Recharts tooltips.
 */

import React, { useMemo } from "react";
import { useChartTheme } from "../hooks/useChartTheme";

export interface ChartTooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
  /** Formatter applied to each value. */
  formatter?: (value: number, name: string, dataKey?: string) => string;
  /** Optional label formatter. */
  labelFormatter?: (label: string | number) => string;
  /** Hides the label row when true. */
  hideLabel?: boolean;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = (v) => (typeof v === "number" ? v.toFixed(2) : String(v)),
  labelFormatter = (l) => String(l),
  hideLabel = false,
}: ChartTooltipProps) {
  const theme = useChartTheme();

  const items = useMemo(() => {
    if (!payload || payload.length === 0) return [];
    return payload
      .filter((item) => item.value !== undefined && item.value !== null)
      .map((item) => ({
        name: item.name || item.dataKey || "Value",
        value: formatter(Number(item.value), item.name || "Value", item.dataKey),
        color: item.color || theme.foreground,
      }));
  }, [payload, formatter, theme.foreground]);

  if (!active || items.length === 0) return null;

  return (
    <div
      className={`rounded-lg border p-3 shadow-lg ${prefersReducedMotion ? "" : "backdrop-blur-sm"}`}
      style={{
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        color: theme.tooltipFg,
        fontSize: "12px",
        minWidth: "120px",
      }}
    >
      {!hideLabel && label !== undefined && (
        <p className="mb-2 text-xs" style={{ color: theme.muted }}>
          {labelFormatter(label)}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
