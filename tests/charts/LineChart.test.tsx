import React from "react";
import { render, screen } from "@testing-library/react";
import { LineChart } from "@/charts/LineChart";
import { ThemeProvider } from "@/contexts/ThemeContext";

const sampleData = [
  { label: "A", value: 10 },
  { label: "B", value: 20 },
];

describe("LineChart", () => {
  function renderChart(props = {}) {
    return render(
      <ThemeProvider>
        <LineChart data={sampleData} title="Line Chart" {...props} />
      </ThemeProvider>
    );
  }

  it("renders the chart title", () => {
    renderChart();
    expect(screen.getByText("Line Chart")).toBeInTheDocument();
  });

  it("renders as an accessible image", () => {
    renderChart({ accessibility: { label: "Line chart summary" } });
    expect(screen.getByRole("img", { name: "Line chart summary" })).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    renderChart({ data: [] });
    expect(screen.getByText("No data available for this chart.")).toBeInTheDocument();
  });
});
