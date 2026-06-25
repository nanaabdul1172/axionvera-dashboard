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
}

export function LineChart({
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
}: LineChartProps) {
  const average = useMemo(() => {
    if (!showAverage || data.length === 0) return null;
    return data.reduce((sum, d) => sum + (d[dataKey] as number), 0) / data.length;
  }, [data, dataKey, showAverage]);

  const ChartComponent = isArea ? AreaChart : ReLineChart;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          {average !== null && (
            <ReferenceLine
              y={average}
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="4 4"
              label={{
                value: `Avg: ${yAxisFormatter(average)}`,
                position: "insideTopRight",
                fill: "rgba(255,255,255,0.5)",
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
              fill={`url(#gradient-${dataKey})`}
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
    </div>
  );
}