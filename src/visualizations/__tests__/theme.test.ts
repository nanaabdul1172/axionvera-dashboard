import {
  buildChartTheme,
  resolveChartThemeMode,
  getSeriesColor,
  withOpacity,
  DEFAULT_SERIES_COLORS,
} from "../theme";

describe("buildChartTheme", () => {
  it("returns dark tokens for dark mode", () => {
    const theme = buildChartTheme("dark");
    expect(theme.mode).toBe("dark");
    expect(theme.background).toBe("#020617");
    expect(theme.foreground).toBe("#f8fafc");
    expect(theme.series).toEqual(DEFAULT_SERIES_COLORS);
  });

  it("returns light tokens for light mode", () => {
    const theme = buildChartTheme("light");
    expect(theme.mode).toBe("light");
    expect(theme.background).toBe("#ffffff");
    expect(theme.foreground).toBe("#0f172a");
  });
});

describe("resolveChartThemeMode", () => {
  it("returns explicit mode when provided", () => {
    expect(resolveChartThemeMode("dark")).toBe("dark");
    expect(resolveChartThemeMode("light")).toBe("light");
  });

  it("falls back to light when document is unavailable", () => {
    expect(resolveChartThemeMode("system")).toBe("light");
  });
});

describe("getSeriesColor", () => {
  it("returns the color at the given index", () => {
    expect(getSeriesColor(0)).toBe(DEFAULT_SERIES_COLORS[0]);
    expect(getSeriesColor(1)).toBe(DEFAULT_SERIES_COLORS[1]);
  });

  it("wraps around when index exceeds palette length", () => {
    expect(getSeriesColor(DEFAULT_SERIES_COLORS.length)).toBe(DEFAULT_SERIES_COLORS[0]);
  });

  it("uses a custom palette when provided", () => {
    const palette = ["#ff0000", "#00ff00"];
    expect(getSeriesColor(0, palette)).toBe("#ff0000");
    expect(getSeriesColor(2, palette)).toBe("#ff0000");
  });
});

describe("withOpacity", () => {
  it("converts a hex color to rgba", () => {
    expect(withOpacity("#6366f1", 0.5)).toBe("rgba(99, 102, 241, 0.5)");
  });

  it("passes through non-hex colors", () => {
    expect(withOpacity("red", 0.5)).toBe("red");
  });
});
