import React from "react";
import { render, screen } from "@testing-library/react";
import { StatisticsBar } from "@/charts/StatisticsBar";

jest.mock("@/hooks/useChartTheme", () => ({
  useChartTheme: () => ({
    gridStroke: "#ccc",
    axisTickFill: "#666",
    axisLineStroke: "#aaa",
    tooltipBg: "#fff",
    tooltipBorder: "#ddd",
    tooltipTextColor: "#000",
    tooltipLabelColor: "#555",
    referenceLineColor: "#999",
    palette: ["#6366f1"],
    isDark: false,
  }),
}));

describe("StatisticsBar", () => {
  it("renders with role=img", () => {
    render(<StatisticsBar min={0} max={100} average={50} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("includes min, average, and max in aria-label", () => {
    render(
      <StatisticsBar
        min={10}
        max={90}
        average={45}
        formatter={(v) => `${v}%`}
      />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("aria-label", expect.stringContaining("10%"));
    expect(img).toHaveAttribute("aria-label", expect.stringContaining("45%"));
    expect(img).toHaveAttribute("aria-label", expect.stringContaining("90%"));
  });

  it("includes current value in aria-label when provided", () => {
    render(
      <StatisticsBar
        min={0}
        max={100}
        average={50}
        current={72}
        formatter={(v) => `${v}`}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("72")
    );
  });

  it("renders the label text when provided", () => {
    render(
      <StatisticsBar min={0} max={100} average={50} label="APY Range" />
    );
    expect(screen.getByText("APY Range")).toBeInTheDocument();
  });

  it("renders an SVG element", () => {
    const { container } = render(<StatisticsBar min={0} max={100} average={50} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
