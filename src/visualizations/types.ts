/**
 * @module visualizations/types
 *
 * Shared type definitions for the dashboard visualization framework.
 */

/** Available chart color themes. */
export type ChartThemeMode = "light" | "dark";

/** Base data point accepted by most chart components. */
export interface ChartDataPoint {
  /** Category or timestamp label displayed on the x-axis. */
  label: string;
  /** Primary numeric value. */
  value: number;
  /** Any additional numeric or string fields for multi-series charts. */
  [key: string]: string | number;
}

/** Configuration for a single series in a multi-series chart. */
export interface ChartSeries {
  /** Data key mapped to this series. */
  key: string;
  /** Human-readable series name used by legends and tooltips. */
  name: string;
  /** Render type. */
  type: "line" | "bar" | "area";
  /** Stroke/fill color. */
  color: string;
  /** Optional y-axis side. */
  yAxisId?: "left" | "right";
}

/** Accessibility metadata for a chart. */
export interface ChartAccessibility {
  /** Accessible name describing the chart. */
  label?: string;
  /** Optional longer description. */
  description?: string;
  /** Whether to hide the chart from screen readers (e.g. decorative). */
  hidden?: boolean;
}

/** Common props shared by framework chart components. */
export interface CommonChartProps {
  /** Chart title rendered above the visualization. */
  title?: string;
  /** Optional subtitle or helper text. */
  subtitle?: string;
  /** Explicit chart height; defaults to 300. */
  height?: number;
  /** Additional CSS classes. */
  className?: string;
  /** Accessibility metadata. */
  accessibility?: ChartAccessibility;
}

/** Theme-aware color tokens for charts. */
export interface ChartThemeTokens {
  mode: ChartThemeMode;
  background: string;
  foreground: string;
  muted: string;
  grid: string;
  axis: string;
  border: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipFg: string;
  series: string[];
}

/** Loading/error/empty state renderers. */
export interface ChartStateRenderers {
  loading?: React.ReactNode;
  empty?: React.ReactNode;
  error?: React.ReactNode;
}
