import React from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { ChartWrapper } from "./shared/ChartWrapper";
import { ChartTooltip } from "./shared/ChartTooltip";

export interface PieChartDataPoint {
  name: string;
  value: number;
  color: string;
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
  description?: string;
  isLoading?: boolean;
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
  title = "Pie chart",
  description,
  isLoading = false,
}: PieChartProps) {
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
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
        </RePieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});
