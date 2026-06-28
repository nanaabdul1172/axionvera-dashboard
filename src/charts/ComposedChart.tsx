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
import { useChartTheme } from "@/hooks/useChartTheme";
import { ChartWrapper } from "./shared/ChartWrapper";
import { ChartTooltip } from "./shared/ChartTooltip";

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
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export const ComposedChart = React.memo(function ComposedChart({
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
  title = "Composed chart",
  description,
  isLoading = false,
}: ComposedChartProps) {
  const theme = useChartTheme();
  const hasRightAxis = series.some((s) => s.yAxisId === "right");

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
        <ReComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            yAxisId="left"
            tick={{ fontSize: 12, fill: theme.axisTickFill }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yAxisFormatterLeft}
            width={60}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: theme.axisTickFill }}
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
                  formatter={(value, name) =>
                    tooltipFormatter(value as number, name ?? "")
                  }
                />
              }
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px", color: theme.axisTickFill }}
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
    </ChartWrapper>
  );
});
