import React, { useMemo } from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, useChartTheme, resolveColor } from "@/visualizations";
import type { ChartAccessibility } from "@/visualizations";

export interface BarChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  dataKey?: string;
  labelKey?: string;
  color?: string;
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  height?: number;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  className?: string;
  barSize?: number;
  radius?: [number, number, number, number];
  title?: string;
  accessibility?: ChartAccessibility;
}

export const BarChart = React.memo(function BarChart({
  data,
  dataKey = "value",
  labelKey = "label",
  color,
  colors,
  showGrid = true,
  showTooltip = true,
  height = 300,
  yAxisFormatter = (v) => v.toFixed(2),
  tooltipFormatter = (v) => v.toFixed(4),
  className = "",
  barSize = 24,
  radius = [4, 4, 0, 0],
  title,
  accessibility,
}: BarChartProps) {
  const theme = useChartTheme();

  const seriesColor = useMemo(
    () => color || theme.series[0],
    [color, theme.series]
  );

  return (
    <ChartContainer
      data={data}
      title={title}
      height={height}
      className={className}
      accessibility={accessibility}
    >
      <ReBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 12, fill: theme.muted }}
          axisLine={{ stroke: theme.axis }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={{ fontSize: 12, fill: theme.muted }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yAxisFormatter}
          width={60}
        />
        {showTooltip && (
          <Tooltip
            content={
              <ChartTooltip
                formatter={(value) =>
                  tooltipFormatter(Number(value))
                }
              />
            }
          />
        )}
        <Bar dataKey={dataKey} fill={seriesColor} barSize={barSize} radius={radius}>
          {colors &&
            data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          {!colors &&
            data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={resolveColor(index, theme.series)}
              />
            ))}
        </Bar>
      </ReBarChart>
    </ChartContainer>
  );
});
