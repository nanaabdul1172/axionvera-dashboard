/**
 * @module visualizations
 *
 * Dashboard visualization framework public API.
 *
 * Provides theme-aware, accessible primitives and helpers for building
 * consistent charts and statistical visualizations across the dashboard.
 */

// Theme and tokens
export {
  DEFAULT_SERIES_COLORS,
  COLORBLIND_SERIES_COLORS,
  buildChartTheme,
  resolveChartThemeMode,
  getSeriesColor,
  withOpacity,
} from "./theme";

// Hooks
export { useChartTheme, useChartThemeMode } from "./hooks/useChartTheme";

// Utilities
export { gradientId, resolveColor, hexToRgba, generateMonochromePalette } from "./utils/colors";

// Components
export { ChartContainer } from "./components/ChartContainer";
export { ChartTooltip } from "./components/ChartTooltip";
export { ChartLegend } from "./components/ChartLegend";
export { EmptyState } from "./components/EmptyState";

// Types
export type {
  ChartThemeMode,
  ChartDataPoint,
  ChartSeries,
  ChartAccessibility,
  CommonChartProps,
  ChartThemeTokens,
  ChartStateRenderers,
} from "./types";

export type { ChartContainerProps } from "./components/ChartContainer";
export type { ChartTooltipProps } from "./components/ChartTooltip";
