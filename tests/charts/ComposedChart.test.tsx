import React from "react";
import { render, screen } from "@testing-library/react";
import { ComposedChart } from "@/charts/ComposedChart";
import { ThemeProvider } from "@/contexts/ThemeContext";

const sampleData = [
  { label: "A", revenue: 10, users: 100 },
  { label: "B", revenue: 20, users: 150 },
];

const series = [
  { key: "revenue", type: "bar" as const, color: "#6366f1", name: "Revenue" },
  { key: "users", type: "line" as const, color: "#10b981", name: "Users" },
];

describe("ComposedChart", () => {
  function renderChart(props = {}) {
    return render(
      <ThemeProvider>
        <ComposedChart data={sampleData} series={series} title="Composed Chart" {...props} />
      </ThemeProvider>
    );
  }

  it("renders the chart title", () => {
    renderChart();
    expect(screen.getByText("Composed Chart")).toBeInTheDocument();
  });

  it("renders as an accessible image", () => {
    renderChart({ accessibility: { label: "Composed chart summary" } });
    expect(screen.getByRole("img", { name: "Composed chart summary" })).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    renderChart({ data: [] });
    expect(screen.getByText("No data available for this chart.")).toBeInTheDocument();
  });
});
