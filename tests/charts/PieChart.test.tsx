import React from "react";
import { render, screen } from "@testing-library/react";
import { PieChart } from "@/charts/PieChart";
import { ThemeProvider } from "@/contexts/ThemeContext";

const sampleData = [
  { name: "A", value: 10, color: "#6366f1" },
  { name: "B", value: 20, color: "#10b981" },
];

describe("PieChart", () => {
  function renderChart(props = {}) {
    return render(
      <ThemeProvider>
        <PieChart data={sampleData} title="Pie Chart" {...props} />
      </ThemeProvider>
    );
  }

  it("renders the chart title", () => {
    renderChart();
    expect(screen.getByText("Pie Chart")).toBeInTheDocument();
  });

  it("renders as an accessible image", () => {
    renderChart({ accessibility: { label: "Pie chart summary" } });
    expect(screen.getByRole("img", { name: "Pie chart summary" })).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    renderChart({ data: [] });
    expect(screen.getByText("No data available for this chart.")).toBeInTheDocument();
  });
});
