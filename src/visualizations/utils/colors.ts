/**
 * @module visualizations/utils/colors
 *
 * Color helpers used by the visualization framework.
 */

import { DEFAULT_SERIES_COLORS } from "../theme";

/** Generate a stable gradient id from a base key. */
export function gradientId(base: string): string {
  return `vv-gradient-${base.replace(/[^a-zA-Z0-9-]/g, "-")}`;
}

/** Pick a deterministic color for a series index. */
export function resolveColor(index: number, palette?: string[]): string {
  const colors = palette && palette.length > 0 ? palette : DEFAULT_SERIES_COLORS;
  return colors[index % colors.length];
}

/** Convert a hex color to an rgba string with the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Build a bar color palette from a single base hue by varying lightness. */
export function generateMonochromePalette(baseColor: string, steps: number): string[] {
  const rgba = hexToRgba(baseColor, 1).replace(")", "").split("(")[1].split(",");
  const r = parseInt(rgba[0].trim(), 10);
  const g = parseInt(rgba[1].trim(), 10);
  const b = parseInt(rgba[2].trim(), 10);

  const palette: string[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = 0.4 + (i / Math.max(1, steps - 1)) * 0.6;
    palette.push(
      `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`
    );
  }
  return palette;
}
