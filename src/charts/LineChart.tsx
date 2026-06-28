import React, { useMemo } from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { ChartWrapper } from "./shared/ChartWrapper";
import { ChartTooltip } from "./shared/ChartTooltip";

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
  description?: string;
  isLoading?: boolean;
}

export const LineChart = React.memo(function LineChart({
  data,
  dataKey = "value",
  labelKey = "label",
  color = "#6366f1",
  gradientFrom = "#6366f1",
  gradientTo = "#6366f1",
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
  title = "Line chart",
  description,
  isLoading = false,
}: LineChartProps) {
  const theme = useChartTheme();

  const average = useMemo(() => {
    if (!showAverage || data.length === 0) return null;
    return data.reduce((sum, d) => sum + (d[dataKey] as number), 0) / data.length;
  }, [data, dataKey, showAverage]);

  const ChartComponent = isArea ? AreaChart : ReLineChart;
  const gradientId = `gradient-${dataKey}-${title.replace(/\s+/g, "-")}`;

  return (
    <ChartWrapper
      title={title}
      description={description}
      isLoading={isLoading}
      isEmpty={data.length === 0}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          )}
          <XAxis
            dataKey={labelKey}
            tick={{ fontSize: 12, fill: theme.axisTickFill }}
            axisLine={{ stroke: theme.axisLineStroke }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 12, fill: theme.axisTickFill }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yAxisFormatter}
            width={60}
          />
          {showTooltip && (
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(value) => tooltipFormatter(value as number)}
                />
              }
            />
          )}
          {average !== null && (
            <ReferenceLine
              y={average}
              stroke={theme.referenceLineColor}
              strokeDasharray="4 4"
              label={{
                value: `Avg: ${yAxisFormatter(average)}`,
                position: "insideTopRight",
                fill: theme.axisTickFill,
                fontSize: 11,
              }}
            />
          )}
          {referenceValue !== undefined && (
            <ReferenceLine
              y={referenceValue}
              stroke={color}
              strokeDasharray="6 3"
              strokeOpacity={0.5}
              label={{
                value: referenceLabel || "Current",
                position: "insideTopLeft",
                fill: color,
                fontSize: 11,
              }}
            />
          )}
          {isArea ? (
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={strokeWidth}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});
