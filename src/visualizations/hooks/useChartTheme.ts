/**
 * @module visualizations/hooks/useChartTheme
 *
 * React hook for resolving theme-aware chart tokens.
 */

import { useMemo, useSyncExternalStore } from "react";
import { buildChartTheme, resolveChartThemeMode } from "../theme";
import type { ChartThemeMode, ChartThemeTokens } from "../types";

interface UseChartThemeOptions {
  /** Explicit mode; falls back to the document theme. */
  mode?: ChartThemeMode | "system";
}

function getDocumentTheme(): ChartThemeMode {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr as ChartThemeMode;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function subscribeToThemeChanges(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(callback);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  mediaQuery.addEventListener("change", callback);

  return () => {
    observer.disconnect();
    mediaQuery.removeEventListener("change", callback);
  };
}

/**
 * Returns theme tokens based on the document `data-theme` attribute or an
 * explicit override. Works inside or outside the app's ThemeProvider.
 */
export function useChartTheme(options: UseChartThemeOptions = {}): ChartThemeTokens {
  const { mode } = options;
  const documentMode = useSyncExternalStore(
    subscribeToThemeChanges,
    getDocumentTheme,
    () => "light" as ChartThemeMode
  );

  return useMemo(() => {
    const resolved: ChartThemeMode = mode && mode !== "system" ? mode : documentMode;
    return buildChartTheme(resolved);
  }, [mode, documentMode]);
}

/**
 * Returns the currently resolved light/dark mode without full tokens.
 */
export function useChartThemeMode(options: UseChartThemeOptions = {}): ChartThemeMode {
  const { mode } = options;
  const documentMode = useSyncExternalStore(
    subscribeToThemeChanges,
    getDocumentTheme,
    () => "light" as ChartThemeMode
  );

  const resolved: ChartThemeMode = mode && mode !== "system" ? mode : documentMode;
  return resolved;
}
