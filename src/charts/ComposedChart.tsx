import React from "react";
import {
  ComposedChart as ReComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface ComposedDataPoint {
  label: string;
  [key: string]: string | number;
}

interface SeriesConfig {
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
}: ComposedChartProps) {
  const hasRightAxis = series.some((s) => s.yAxisId === "right");

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ReComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            yAxisId="left"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yAxisFormatterLeft}
            width={60}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "rgba(255,255,255,0.5)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={yAxisFormatterRight}
              width={60}
            />
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(17, 24, 39, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              formatter={(value: number, name: string) => tooltipFormatter(value, name)}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}
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
                activeDot={{ r: 4, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
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
      </ResponsiveContainer>
    </div>
  );
}