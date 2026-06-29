import React, { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ProtocolHealthMetric, ProtocolHealthStatus } from "@/services/protocolHealth";

export interface NetworkNode {
  id: string;
  label: string;
  description?: string;
  status: ProtocolHealthStatus;
  latencyMs?: number;
  x: number;
  y: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  label?: string;
}

interface NetworkDiagramProps {
  metrics: ProtocolHealthMetric[];
  nodes?: NetworkNode[];
  edges?: NetworkEdge[];
  height?: number;
  title?: string;
  description?: string;
  className?: string;
}

const STATUS_COLOR: Record<ProtocolHealthStatus, string> = {
  operational: "#10b981",
  degraded:    "#f59e0b",
  down:        "#ef4444",
};

const STATUS_FILL_OPACITY: Record<ProtocolHealthStatus, number> = {
  operational: 0.15,
  degraded:    0.18,
  down:        0.2,
};

const DEFAULT_NODES: NetworkNode[] = [
  { id: "soroban-rpc",      label: "Soroban RPC",       status: "operational", x: 75,  y: 110 },
  { id: "horizon",          label: "Horizon Indexer",   status: "operational", x: 75,  y: 30  },
  { id: "contract-config",  label: "Contract Config",   status: "operational", x: 195, y: 70  },
  { id: "event-stream",     label: "Event Stream",      status: "operational", x: 315, y: 30  },
  { id: "transaction-flow", label: "Transaction Flow",  status: "operational", x: 315, y: 110 },
];

const DEFAULT_EDGES: NetworkEdge[] = [
  { from: "soroban-rpc",     to: "contract-config" },
  { from: "horizon",         to: "contract-config" },
  { from: "contract-config", to: "event-stream" },
  { from: "contract-config", to: "transaction-flow" },
];

function NodeRadius() {
  return 22;
}

export const NetworkDiagram = React.memo(function NetworkDiagram({
  metrics,
  nodes: nodesProp,
  edges = DEFAULT_EDGES,
  height = 170,
  title = "Protocol network diagram",
  description,
  className,
}: NetworkDiagramProps) {
  const uniqueId = useId();
  const markerId = `arrowhead-${uniqueId.replace(/:/g, "")}`;

  const nodes = useMemo<NetworkNode[]>(() => {
    const base = nodesProp ?? DEFAULT_NODES;
    if (metrics.length === 0) return base;

    const metricMap = new Map(metrics.map((m) => [m.id, m]));
    return base.map((node) => {
      const metric = metricMap.get(node.id);
      if (!metric) return node;
      return {
        ...node,
        status: metric.status,
        latencyMs: metric.latencyMs,
      };
    });
  }, [nodesProp, metrics]);

  const r = NodeRadius();
  const viewBoxWidth = 390;
  const viewBoxHeight = height;

  const srText = nodes
    .map((n) => `${n.label}: ${n.status}${n.latencyMs != null ? ` (${n.latencyMs}ms)` : ""}`)
    .join("; ");

  const ariaLabel = `${title}. ${description ?? srText}`;

  return (
    <div className={cn("w-full", className)}>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height }}
      >
        <title>{title}</title>

        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="var(--color-border-primary, #cbd5e1)"
              opacity={0.6}
            />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes.find((n) => n.id === edge.from);
          const to   = nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;

          const x1 = from.x + ux * r;
          const y1 = from.y + uy * r;
          const x2 = to.x   - ux * (r + 8);
          const y2 = to.y   - uy * (r + 8);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-border-primary, #cbd5e1)"
              strokeWidth={1.5}
              strokeOpacity={0.5}
                markerEnd={`url(#${markerId})`}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const color   = STATUS_COLOR[node.status];
          const opacity = STATUS_FILL_OPACITY[node.status];
          const isPulse = node.status === "degraded" || node.status === "down";

          return (
            <g key={node.id} aria-label={`${node.label}: ${node.status}`}>
              {/* Pulse ring for non-operational nodes */}
              {isPulse && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${r + 4};${r + 12};${r + 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.4;0;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Node background circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeWidth={1.5}
              />

              {/* Status dot */}
              <circle
                cx={node.x + r - 6}
                cy={node.y - r + 6}
                r={4}
                fill={color}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + r + 14}
                textAnchor="middle"
                fontSize={9}
                fontWeight={500}
                fill="var(--color-text-secondary, #475569)"
              >
                {node.label}
              </text>

              {/* Latency badge */}
              {node.latencyMs != null && (
                <text
                  x={node.x}
                  y={node.y - r - 6}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--color-text-muted, #94a3b8)"
                >
                  {node.latencyMs}ms
                </text>
              )}

              {/* Center icon (first letter) */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill={color}
              >
                {node.label.charAt(0)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Screen-reader text summary */}
      <p className="sr-only">{srText}</p>
    </div>
  );
});

/**
 * Adapter: convert ProtocolHealthMetric[] to NetworkNode[] for the diagram.
 * Preserves the default layout positions while injecting live status data.
 */
export function metricsToNetworkGraph(metrics: ProtocolHealthMetric[]): {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
} {
  const metricMap = new Map(metrics.map((m) => [m.id, m]));
  const nodes = DEFAULT_NODES.map((node) => {
    const metric = metricMap.get(node.id);
    return metric
      ? { ...node, status: metric.status, latencyMs: metric.latencyMs }
      : node;
  });
  return { nodes, edges: DEFAULT_EDGES };
}
