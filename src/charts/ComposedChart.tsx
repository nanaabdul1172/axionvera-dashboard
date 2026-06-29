import React, { useMemo } from "react";
import {
  ComposedChart as ReComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltip, useChartTheme } from "@/visualizations";
import type { ChartAccessibility } from "@/visualizations";

export interface ComposedDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface SeriesConfig {
  key: string;
  type: "line" | "bar";
  color: string;
  name: string;
  yAxisId?: "left" | "right";
}

interface ComposedChartProps {
  data: ComposedDataPoint[];
  series: SeriesConfig[];
  labelKey?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  height?: number;
  yAxisFormatterLeft?: (value: number) => string;
  yAxisFormatterRight?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  className?: string;
  title?: string;
  accessibility?: ChartAccessibility;
}

export function ComposedChart({
  data,
  series,
  labelKey = "label",
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  height = 300,
  yAxisFormatterLeft = (v) => v.toFixed(2),
  yAxisFormatterRight = (v) => v.toFixed(2),
  tooltipFormatter = (value, name) => [value.toFixed(4), name],
  className = "",
  title,
  accessibility,
}: ComposedChartProps) {
  const theme = useChartTheme();
  const hasRightAxis = useMemo(
    () => series.some((s) => s.yAxisId === "right"),
    [series]
  );

  return (
    <ChartContainer
      data={data}
      title={title}
      height={height}
      className={className}
      accessibility={accessibility}
    >
      <ReComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 12, fill: theme.muted }}
          axisLine={{ stroke: theme.axis }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: theme.muted }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yAxisFormatterLeft}
          width={60}
        />
        {hasRightAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: theme.muted }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yAxisFormatterRight}
            width={60}
          />
        )}
        {showTooltip && (
          <Tooltip
            content={
              <ChartTooltip
                formatter={(value, name) => {
                  const [v, n] = tooltipFormatter(Number(value), String(name));
                  return `${v} (${n})`;
                }}
              />
            }
          />
        )}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: "12px", color: theme.foreground }}
            formatter={(value) => <span style={{ color: theme.foreground }}>{value}</span>}
          />
        )}
        {series.map((s) =>
          s.type === "line" ? (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              yAxisId={s.yAxisId || "left"}
              name={s.name}
              dot={false}
              activeDot={{ r: 4, fill: s.color, stroke: theme.background, strokeWidth: 2 }}
            />
          ) : (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              yAxisId={s.yAxisId || "left"}
              name={s.name}
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
          )
        )}
      </ReComposedChart>
    </ChartContainer>
  );
}
