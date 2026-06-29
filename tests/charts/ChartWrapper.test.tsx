import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChartWrapper } from "@/charts/shared/ChartWrapper";

describe("ChartWrapper", () => {
  it("renders children normally", () => {
    render(
      <ChartWrapper title="My Chart">
        <div>Chart content</div>
      </ChartWrapper>
    );
    expect(screen.getByText("Chart content")).toBeInTheDocument();
  });

  it("has role=img and aria-label", () => {
    render(
      <ChartWrapper title="Balance" description="Balance over time">
        <div>content</div>
      </ChartWrapper>
    );
    const region = screen.getByRole("img");
    expect(region).toHaveAttribute("aria-label", "Balance: Balance over time");
  });

  it("shows skeleton when isLoading=true", () => {
    render(
      <ChartWrapper title="X" isLoading>
        <div>hidden content</div>
      </ChartWrapper>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("hidden content")).not.toBeInTheDocument();
  });

  it("shows empty state when isEmpty=true", () => {
    render(
      <ChartWrapper title="X" isEmpty emptyMessage="No APY data yet">
        <div>hidden</div>
      </ChartWrapper>
    );
    expect(screen.getByText("No APY data yet")).toBeInTheDocument();
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
  });

  it("shows error boundary fallback when child throws", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const ThrowingChild = () => {
      throw new Error("render error");
    };
    render(
      <ChartWrapper title="Broken Chart">
        <ThrowingChild />
      </ChartWrapper>
    );
    expect(screen.getByText(/Broken Chart unavailable/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("calls onRetry when retry button is clicked", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const onRetry = jest.fn();
    const ThrowingChild = () => {
      throw new Error("boom");
    };
    render(
      <ChartWrapper title="Chart" onRetry={onRetry}>
        <ThrowingChild />
      </ChartWrapper>
    );
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("uses default aria-label when title and description are omitted", () => {
    render(
      <ChartWrapper>
        <div>c</div>
      </ChartWrapper>
    );
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Chart");
  });
});
