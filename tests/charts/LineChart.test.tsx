import React from "react";
import { render, screen } from "@testing-library/react";
import { LineChart } from "@/charts/LineChart";

// Mock useChartTheme to avoid needing ThemeContext
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

const sampleData = [
  { label: "Jan", value: 100 },
  { label: "Feb", value: 150 },
  { label: "Mar", value: 120 },
];

describe("LineChart", () => {
  it("renders a chart wrapper with role=img", () => {
    render(<LineChart data={sampleData} title="Test Line Chart" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("uses title as aria-label", () => {
    render(<LineChart data={sampleData} title="Balance Trend" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("Balance Trend"));
  });

  it("shows skeleton when isLoading=true", () => {
    render(<LineChart data={sampleData} isLoading title="Loading chart" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows empty state when data is empty", () => {
    render(<LineChart data={[]} title="Empty chart" />);
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it("renders the ResponsiveContainer when data is present", () => {
    render(<LineChart data={sampleData} title="Has data" />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
