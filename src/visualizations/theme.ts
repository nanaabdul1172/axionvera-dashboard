/**
 * @module visualizations/theme
 *
 * Theme tokens, color scales, and helpers for the visualization framework.
 */

import type { ChartThemeMode, ChartThemeTokens } from "./types";

/** Default color palette used when no explicit colors are provided. */
export const DEFAULT_SERIES_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

/** Color-blind friendly palette alternative. */
export const COLORBLIND_SERIES_COLORS = [
  "#0173b2",
  "#de8f05",
  "#029e73",
  "#d55e00",
  "#cc78bc",
  "#ca9161",
  "#fbafe4",
  "#949494",
];

/** Build a deterministic theme token set for the given mode. */
export function buildChartTheme(mode: ChartThemeMode): ChartThemeTokens {
  const isDark = mode === "dark";
  return {
    mode,
    background: isDark ? "#020617" : "#ffffff",
    foreground: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#94a3b8" : "#64748b",
    grid: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.15)",
    axis: isDark ? "#334155" : "#cbd5e1",
    border: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    tooltipBg: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.98)",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipFg: isDark ? "#f1f5f9" : "#0f172a",
    series: DEFAULT_SERIES_COLORS,
  };
}

/** Resolve a theme mode from an explicit value or from the document. */
export function resolveChartThemeMode(mode?: ChartThemeMode | "system"): ChartThemeMode {
  if (mode && mode !== "system") return mode;
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
}

/** Pick a color from a palette deterministically by index. */
export function getSeriesColor(index: number, palette?: string[]): string {
  const colors = palette && palette.length > 0 ? palette : DEFAULT_SERIES_COLORS;
  return colors[index % colors.length];
}

/** Build an alpha-adjusted hex/rgb color string for area fills. */
export function withOpacity(color: string, opacity: number): string {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }
  return color;
}
