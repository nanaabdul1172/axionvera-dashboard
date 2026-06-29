import React, { useMemo } from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { ChartContainer, ChartTooltip, useChartTheme, gradientId } from "@/visualizations";
import type { ChartAccessibility } from "@/visualizations";

export interface LineChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  dataKey?: string;
  labelKey?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showAverage?: boolean;
  height?: number;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  className?: string;
  isArea?: boolean;
  strokeWidth?: number;
  referenceValue?: number;
  referenceLabel?: string;
  title?: string;
  accessibility?: ChartAccessibility;
}

export const LineChart = React.memo(function LineChart({
  data,
  dataKey = "value",
  labelKey = "label",
  color,
  gradientFrom,
  gradientTo,
  showGrid = true,
  showTooltip = true,
  showAverage = false,
  height = 300,
  yAxisFormatter = (v) => v.toFixed(2),
  tooltipFormatter = (v) => v.toFixed(4),
  className = "",
  isArea = false,
  strokeWidth = 2,
  referenceValue,
  referenceLabel,
  title,
  accessibility,
}: LineChartProps) {
  const theme = useChartTheme();
  const seriesColor = useMemo(
    () => color || theme.series[0],
    [color, theme.series]
  );
  const fromColor = gradientFrom || seriesColor;
  const toColor = gradientTo || seriesColor;
  const gid = useMemo(() => gradientId(dataKey), [dataKey]);

  const average = useMemo(() => {
    if (!showAverage || data.length === 0) return null;
    return data.reduce((sum, d) => sum + (d[dataKey] as number), 0) / data.length;
  }, [data, dataKey, showAverage]);

  const ChartComponent = isArea ? AreaChart : ReLineChart;

  return (
    <ChartContainer
      data={data}
      title={title}
      height={height}
      className={className}
      accessibility={accessibility}
    >
      <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fromColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={toColor} stopOpacity={0} />
          </linearGradient>
        </defs>
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
            content={<ChartTooltip formatter={(value) => tooltipFormatter(Number(value))} />}
          />
        )}
        {average !== null && (
          <ReferenceLine
            y={average}
            stroke={theme.muted}
            strokeDasharray="4 4"
            label={{
              value: `Avg: ${yAxisFormatter(average)}`,
              position: "insideTopRight",
              fill: theme.muted,
              fontSize: 11,
            }}
          />
        )}
        {referenceValue !== undefined && (
          <ReferenceLine
            y={referenceValue}
            stroke={seriesColor}
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{
              value: referenceLabel || "Current",
              position: "insideTopLeft",
              fill: seriesColor,
              fontSize: 11,
            }}
          />
        )}
        {isArea ? (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={seriesColor}
            strokeWidth={strokeWidth}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={{ r: 4, fill: seriesColor, stroke: theme.background, strokeWidth: 2 }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={seriesColor}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={{ r: 4, fill: seriesColor, stroke: theme.background, strokeWidth: 2 }}
          />
        )}
      </ChartComponent>
    </ChartContainer>
  );
});
