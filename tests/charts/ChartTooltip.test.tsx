import React from "react";
import { render, screen } from "@testing-library/react";
import { ChartTooltip } from "@/charts/shared/ChartTooltip";

describe("ChartTooltip", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <ChartTooltip active={false} payload={[{ name: "Value", value: 42 }]} label="Jan" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing with empty payload", () => {
    const { container } = render(
      <ChartTooltip active={true} payload={[]} label="Jan" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the label", () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: "Value", value: 100 }]}
        label="Feb 2025"
      />
    );
    expect(screen.getByText("Feb 2025")).toBeInTheDocument();
  });

  it("renders a formatted value via formatter", () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: "Balance", value: 1234.5 }]}
        label="Mar"
        formatter={(v) => `$${Number(v).toFixed(2)}`}
      />
    );
    expect(screen.getByText("$1234.50")).toBeInTheDocument();
  });

  it("renders multiple payload entries", () => {
    render(
      <ChartTooltip
        active={true}
        payload={[
          { name: "Deposits", value: 500, color: "#10b981" },
          { name: "Withdrawals", value: 200, color: "#ef4444" },
        ]}
        label="Apr"
      />
    );
    expect(screen.getByText("Deposits")).toBeInTheDocument();
    expect(screen.getByText("Withdrawals")).toBeInTheDocument();
  });

  it("applies labelFormatter when provided", () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: "APY", value: 5.2 }]}
        label="raw-label"
        labelFormatter={(l) => `Formatted: ${l}`}
      />
    );
    expect(screen.getByText("Formatted: raw-label")).toBeInTheDocument();
  });

  it("returns tuple [displayValue, displayName] from formatter", () => {
    render(
      <ChartTooltip
        active={true}
        payload={[{ name: "Metric", value: 99 }]}
        label="X"
        formatter={(v, name) => [`${v}%`, `Renamed ${name}`]}
      />
    );
    expect(screen.getByText("99%")).toBeInTheDocument();
    expect(screen.getByText("Renamed Metric")).toBeInTheDocument();
  });
});
