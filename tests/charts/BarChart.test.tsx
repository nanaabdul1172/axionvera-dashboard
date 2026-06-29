import React from "react";
import { render, screen } from "@testing-library/react";
import { BarChart } from "@/charts/BarChart";
import { ThemeProvider } from "@/contexts/ThemeContext";

const sampleData = [
  { label: "A", value: 10 },
  { label: "B", value: 20 },
];

describe("BarChart", () => {
  function renderChart(props = {}) {
    return render(
      <ThemeProvider>
        <BarChart data={sampleData} title="Bar Chart" {...props} />
      </ThemeProvider>
    );
  }

  it("renders the chart title", () => {
    renderChart();
    expect(screen.getByText("Bar Chart")).toBeInTheDocument();
  });

  it("renders as an accessible image", () => {
    renderChart({ accessibility: { label: "Bar chart summary" } });
    expect(screen.getByRole("img", { name: "Bar chart summary" })).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    renderChart({ data: [] });
    expect(screen.getByText("No data available for this chart.")).toBeInTheDocument();
  });
});
