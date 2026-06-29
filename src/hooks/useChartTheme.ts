import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export const CHART_COLORS = [
  "#6366f1", // indigo   — primary brand
  "#10b981", // emerald  — success / rewards
  "#a855f7", // purple   — secondary accent
  "#f59e0b", // amber    — warning
  "#ef4444", // red      — danger
  "#3b82f6", // blue     — info
  "#f43f5e", // rose     — secondary danger
  "#06b6d4", // cyan     — tertiary accent
] as const;

export interface ChartTheme {
  gridStroke: string;
  axisTickFill: string;
  axisLineStroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipTextColor: string;
  tooltipLabelColor: string;
  referenceLineColor: string;
  palette: readonly string[];
  isDark: boolean;
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return useMemo<ChartTheme>(
    () =>
      isDark
        ? {
            gridStroke: "rgba(148, 163, 184, 0.1)",
            axisTickFill: "rgba(255, 255, 255, 0.5)",
            axisLineStroke: "rgba(255, 255, 255, 0.1)",
            tooltipBg: "rgba(17, 24, 39, 0.95)",
            tooltipBorder: "rgba(255, 255, 255, 0.1)",
            tooltipTextColor: "rgba(255, 255, 255, 0.9)",
            tooltipLabelColor: "rgba(255, 255, 255, 0.6)",
            referenceLineColor: "rgba(255, 255, 255, 0.3)",
            palette: CHART_COLORS,
            isDark: true,
          }
        : {
            gridStroke: "rgba(100, 116, 139, 0.15)",
            axisTickFill: "#64748b",
            axisLineStroke: "#cbd5e1",
            tooltipBg: "#ffffff",
            tooltipBorder: "#cbd5e1",
            tooltipTextColor: "#0f172a",
            tooltipLabelColor: "#475569",
            referenceLineColor: "rgba(100, 116, 139, 0.4)",
            palette: CHART_COLORS,
            isDark: false,
          },
    [isDark]
  );
}
