import React, { useMemo } from "react";
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, useChartTheme } from "@/visualizations";
import type { ChartAccessibility } from "@/visualizations";

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataPoint[];
  showTooltip?: boolean;
  showLegend?: boolean;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  className?: string;
  title?: string;
  accessibility?: ChartAccessibility;
}

export const PieChart = React.memo(function PieChart({
  data,
  showTooltip = true,
  showLegend = true,
  height = 250,
  innerRadius = 60,
  outerRadius = 90,
  tooltipFormatter = (value, name) => [value.toFixed(2), name],
  className = "",
  title,
  accessibility,
}: PieChartProps) {
  const theme = useChartTheme();

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  return (
    <ChartContainer
      data={data}
      title={title}
      height={height}
      className={className}
      accessibility={accessibility}
    >
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey="value"
          stroke={theme.background}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || theme.series[index % theme.series.length]}
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            content={
              <ChartTooltip
                formatter={(value, name) => {
                  const [formattedValue, formattedName] = tooltipFormatter(
                    Number(value),
                    String(name)
                  );
                  return `${formattedValue} (${formattedName})`;
                }}
              />
            }
          />
        )}
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: "12px", color: theme.foreground }}
            formatter={(value) => (
              <span style={{ color: theme.foreground }}>{value}</span>
            )}
          />
        )}
      </RePieChart>
    </ChartContainer>
  );
}
