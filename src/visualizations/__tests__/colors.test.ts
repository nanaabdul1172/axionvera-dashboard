import { gradientId, resolveColor, hexToRgba, generateMonochromePalette } from "../utils/colors";
import { DEFAULT_SERIES_COLORS } from "../theme";

describe("gradientId", () => {
  it("prefixes the base key and sanitizes special characters", () => {
    expect(gradientId("apy")).toBe("vv-gradient-apy");
    expect(gradientId("net flow")).toBe("vv-gradient-net-flow");
  });
});

describe("resolveColor", () => {
  it("uses the default palette by default", () => {
    expect(resolveColor(0)).toBe(DEFAULT_SERIES_COLORS[0]);
  });

  it("uses the provided palette", () => {
    expect(resolveColor(0, ["#abc"])).toBe("#abc");
  });
});

describe("hexToRgba", () => {
  it("converts a hex color to rgba", () => {
    expect(hexToRgba("#6366f1", 0.5)).toBe("rgba(99, 102, 241, 0.5)");
  });
});

describe("generateMonochromePalette", () => {
  it("generates the requested number of colors", () => {
    const palette = generateMonochromePalette("#6366f1", 3);
    expect(palette).toHaveLength(3);
    expect(palette.every((c) => c.startsWith("rgb("))).toBe(true);
  });
});
