import React from "react";
import { render, screen } from "@testing-library/react";
import { ChartContainer } from "../components/ChartContainer";
import { ThemeProvider } from "@/contexts/ThemeContext";

describe("ChartContainer", () => {
  function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  }

  it("renders title and chart when data is present", () => {
    renderWithTheme(
      <ChartContainer
        data={[{ label: "A", value: 1 }]}
        title="Test Chart"
        accessibility={{ label: "Test chart summary" }}
      >
        <div data-testid="chart-body">chart</div>
      </ChartContainer>
    );

    expect(screen.getByText("Test Chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart-body")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Test chart summary" })).toBeInTheDocument();
  });

  it("links accessibility descriptions to the chart wrapper", () => {
    renderWithTheme(
      <ChartContainer
        data={[{ label: "A", value: 1 }]}
        title="Revenue Chart"
        accessibility={{
          label: "Revenue chart summary",
          description: "Shows revenue grouped by month.",
        }}
      >
        <div data-testid="chart-body">chart</div>
      </ChartContainer>
    );

    const chart = screen.getByRole("img", { name: "Revenue chart summary" });
    const descriptionId = chart.getAttribute("aria-describedby");

    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId as string)).toHaveTextContent(
      "Shows revenue grouped by month."
    );
  });

  it("renders empty state when data is empty", () => {
    renderWithTheme(
      <ChartContainer data={[]} title="Empty Chart">
        <div data-testid="chart-body">chart</div>
      </ChartContainer>
    );

    expect(screen.getByText("Empty Chart")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-body")).not.toBeInTheDocument();
    expect(screen.getByText("No data available for this chart.")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading", () => {
    renderWithTheme(
      <ChartContainer data={[{ label: "A", value: 1 }]} title="Loading Chart" loading>
        <div data-testid="chart-body">chart</div>
      </ChartContainer>
    );

    expect(screen.getByText("Loading Chart")).toBeInTheDocument();
    expect(screen.queryByTestId("chart-body")).not.toBeInTheDocument();
  });

  it("renders error state when error is provided", () => {
    renderWithTheme(
      <ChartContainer data={[{ label: "A", value: 1 }]} title="Error Chart" error="boom">
        <div data-testid="chart-body">chart</div>
      </ChartContainer>
    );

    expect(screen.getByText("Error Chart")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("can hide the chart from screen readers", () => {
    renderWithTheme(
      <ChartContainer
        data={[{ label: "A", value: 1 }]}
        title="Hidden Chart"
        accessibility={{ hidden: true }}
      >
        <div data-testid="chart-body">chart</div>
      </ChartContainer>
    );

    const chartBody = screen.getByTestId("chart-body");
    expect(chartBody.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
