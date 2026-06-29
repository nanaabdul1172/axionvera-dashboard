import React, { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useChartTheme } from "@/hooks/useChartTheme";

interface StatisticsBarProps {
  min: number;
  max: number;
  average: number;
  current?: number;
  formatter?: (v: number) => string;
  color?: string;
  label?: string;
  height?: number;
  className?: string;
}

const defaultFmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });

export const StatisticsBar = React.memo(function StatisticsBar({
  min,
  max,
  average,
  current,
  formatter = defaultFmt,
  color = "#6366f1",
  label,
  height = 60,
  className,
}: StatisticsBarProps) {
  const theme = useChartTheme();
  const uniqueId = useId();
  const range = max - min || 1;
  const safeColor = color.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `stat-grad-${safeColor}-${uniqueId.replace(/:/g, "")}`;

  const avgPct   = useMemo(() => ((average - min) / range) * 100, [average, min, range]);
  const currPct  = useMemo(
    () => (current != null ? ((current - min) / range) * 100 : null),
    [current, min, range]
  );

  const ariaLabel = [
    label && `${label} distribution.`,
    `Min: ${formatter(min)},`,
    `Average: ${formatter(average)},`,
    `Max: ${formatter(max)}`,
    current != null ? `, Current: ${formatter(current)}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const trackH = 8;
  const svgW   = 400;
  const svgH   = height;
  const barY   = svgH / 2 - trackH / 2;

  return (
    <div
      className={cn("w-full", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {label && (
        <p className="mb-1 text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
      )}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
        </defs>

        {/* Track background */}
        <rect
          x={0}
          y={barY}
          width={svgW}
          height={trackH}
          rx={trackH / 2}
          fill={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
        />

        {/* Filled range */}
        <rect
          x={0}
          y={barY}
          width={svgW}
          height={trackH}
          rx={trackH / 2}
          fill={`url(#${gradientId})`}
        />

        {/* Average marker line */}
        <line
          x1={(avgPct / 100) * svgW}
          y1={barY - 6}
          x2={(avgPct / 100) * svgW}
          y2={barY + trackH + 6}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Average label */}
        <text
          x={(avgPct / 100) * svgW}
          y={barY - 10}
          textAnchor="middle"
          fontSize={9}
          fill={theme.axisTickFill}
        >
          avg {formatter(average)}
        </text>

        {/* Current value dot */}
        {currPct != null && (
          <circle
            cx={(currPct / 100) * svgW}
            cy={barY + trackH / 2}
            r={6}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
          />
        )}

        {/* Min / Max labels */}
        <text x={2} y={svgH - 2} fontSize={9} fill={theme.axisTickFill}>
          {formatter(min)}
        </text>
        <text x={svgW - 2} y={svgH - 2} textAnchor="end" fontSize={9} fill={theme.axisTickFill}>
          {formatter(max)}
        </text>
      </svg>
    </div>
  );
});
