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
}

export function BarChart({
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
}: BarChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          )}
          <XAxis
            dataKey={labelKey}
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yAxisFormatter}
            width={60}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(17, 24, 39, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              formatter={(value: number) => [tooltipFormatter(value), ""]}
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
    </div>
  );
}