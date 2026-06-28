/**
 * @module visualizations/components/ChartContainer
 *
 * Reusable, theme-aware, accessible chart wrapper used by all framework charts.
 */

import React, { useMemo } from "react";
import { ResponsiveContainer } from "recharts";
import { useChartTheme } from "../hooks/useChartTheme";
import type {
  CommonChartProps,
  ChartStateRenderers,
  ChartDataPoint,
} from "../types";

export interface ChartContainerProps extends CommonChartProps {
  children: React.ReactNode;
  /** Data used to derive empty state. */
  data?: ChartDataPoint[] | unknown[];
  /** Loading flag. */
  loading?: boolean;
  /** Error message. */
  error?: string | null;
  /** Minimum width before the chart is hidden to avoid tiny renders. */
  minWidth?: number;
  /** Custom state renderers. */
  states?: ChartStateRenderers;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ChartContainer({
  children,
  title,
  subtitle,
  height = 300,
  className = "",
  data,
  loading = false,
  error = null,
  minWidth = 200,
  accessibility,
  states,
}: ChartContainerProps) {
  const theme = useChartTheme();

  const isEmpty = useMemo(() => {
    if (!data || data.length === 0) return true;
    return false;
  }, [data]);

  const descriptionId = useMemo(() => {
    if (!accessibility?.description) return undefined;

    const baseId = (accessibility.label || title || "chart")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return `${baseId || "chart"}-desc`;
  }, [accessibility?.description, accessibility?.label, title]);

  const ariaProps = useMemo(() => {
    if (accessibility?.hidden) {
      return { "aria-hidden": true as const };
    }
    return {
      role: "img" as const,
      "aria-label": accessibility?.label || title || "Chart",
      ...(descriptionId ? { "aria-describedby": descriptionId } : {}),
    };
  }, [accessibility, title, descriptionId]);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height,
    minWidth,
    color: theme.foreground,
    background: theme.background,
  };

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-6 ${className}`}
        style={{ borderColor: theme.border, background: theme.background }}
      >
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        {subtitle && <p className="text-sm mb-4" style={{ color: theme.muted }}>{subtitle}</p>}
        {states?.loading ?? (
          <div
            className="w-full animate-pulse rounded-xl"
            style={{ height, background: theme.grid }}
            aria-label="Loading chart"
          />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border p-6 ${className}`}
        style={{ borderColor: "#ef4444", background: "rgba(239, 68, 68, 0.1)" }}
        role="alert"
        aria-live="polite"
      >
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        <p className="text-sm text-red-300">{error}</p>
        {states?.error}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={`rounded-2xl border p-6 ${className}`}
        style={{ borderColor: theme.border, background: theme.background }}
        role="status"
        aria-live="polite"
      >
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        {states?.empty ?? (
          <p className="text-sm" style={{ color: theme.muted }}>
            No data available for this chart.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-6 ${className}`}
      style={{ borderColor: theme.border, background: theme.background }}
      {...ariaProps}
    >
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      {subtitle && (
        <p className="text-sm mb-4" style={{ color: theme.muted }}>
          {subtitle}
        </p>
      )}
      {accessibility?.description && (
        <p id={descriptionId} className="sr-only">
          {accessibility.description}
        </p>
      )}
      <div
        className={`w-full ${prefersReducedMotion ? "" : "transition-opacity duration-300"}`}
        style={containerStyle}
        tabIndex={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
