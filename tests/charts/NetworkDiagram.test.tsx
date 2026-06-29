import React from "react";
import { render, screen } from "@testing-library/react";
import { NetworkDiagram, metricsToNetworkGraph } from "@/charts/NetworkDiagram";
import type { ProtocolHealthMetric } from "@/services/protocolHealth";

const metrics: ProtocolHealthMetric[] = [
  {
    id: "soroban-rpc",
    label: "Soroban RPC",
    description: "RPC endpoint",
    value: "200 OK",
    status: "operational",
    latencyMs: 120,
    checkedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "horizon",
    label: "Horizon Indexer",
    description: "Horizon endpoint",
    value: "200 OK",
    status: "degraded",
    latencyMs: 3200,
    checkedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "contract-config",
    label: "Contract Configuration",
    description: "Contract IDs",
    value: "Configured",
    status: "operational",
    checkedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "event-stream",
    label: "Event Stream",
    description: "Event stream",
    value: "Ready",
    status: "down",
    checkedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "transaction-flow",
    label: "Transaction Flow",
    description: "Tx flow",
    value: "Limited",
    status: "degraded",
    checkedAt: "2025-01-01T00:00:00Z",
  },
];

describe("NetworkDiagram", () => {
  it("renders an SVG with role=img", () => {
    render(<NetworkDiagram metrics={metrics} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("has a descriptive aria-label", () => {
    render(<NetworkDiagram metrics={metrics} title="Protocol Network" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Protocol Network")
    );
  });

  it("renders a screen-reader text summary with all node labels", () => {
    render(<NetworkDiagram metrics={metrics} />);
    const srEl = document.querySelector(".sr-only");
    expect(srEl?.textContent).toContain("Soroban RPC");
    expect(srEl?.textContent).toContain("Horizon Indexer");
    expect(srEl?.textContent).toContain("degraded");
    expect(srEl?.textContent).toContain("down");
  });

  it("includes latency in the screen-reader summary when available", () => {
    render(<NetworkDiagram metrics={metrics} />);
    const srEl = document.querySelector(".sr-only");
    expect(srEl?.textContent).toContain("120ms");
    expect(srEl?.textContent).toContain("3200ms");
  });

  it("renders without crashing when metrics is empty", () => {
    render(<NetworkDiagram metrics={[]} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders SVG element", () => {
    const { container } = render(<NetworkDiagram metrics={metrics} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("metricsToNetworkGraph", () => {
  it("maps metric status onto default nodes", () => {
    const { nodes } = metricsToNetworkGraph(metrics);
    const rpc = nodes.find((n) => n.id === "soroban-rpc");
    expect(rpc?.status).toBe("operational");
    expect(rpc?.latencyMs).toBe(120);
    const horizon = nodes.find((n) => n.id === "horizon");
    expect(horizon?.status).toBe("degraded");
  });

  it("returns the default edges", () => {
    const { edges } = metricsToNetworkGraph(metrics);
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.some((e) => e.from === "soroban-rpc")).toBe(true);
  });
});
