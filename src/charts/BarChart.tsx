import React from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { ChartWrapper } from "./shared/ChartWrapper";
import { ChartTooltip } from "./shared/ChartTooltip";

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
  description?: string;
  isLoading?: boolean;
}

export const BarChart = React.memo(function BarChart({
  data,
  dataKey = "value",
  labelKey = "label",
  color = "#6366f1",
  colors,
  showGrid = true,
  showTooltip = true,
  height = 300,
  yAxisFormatter = (v) => v.toFixed(2),
  tooltipFormatter = (v) => v.toFixed(4),
  className = "",
  barSize = 24,
  radius = [4, 4, 0, 0],
  title = "Bar chart",
  description,
  isLoading = false,
}: BarChartProps) {
  const theme = useChartTheme();

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
        <ReBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <Bar dataKey={dataKey} fill={color} barSize={barSize} radius={radius}>
            {colors &&
              data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});
