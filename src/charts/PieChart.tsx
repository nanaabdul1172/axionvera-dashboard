import React from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
}

export function PieChart({
  data,
  showTooltip = true,
  showLegend = true,
  height = 250,
  innerRadius = 60,
  outerRadius = 90,
  tooltipFormatter = (value, name) => [value.toFixed(2), name],
  className = "",
}: PieChartProps) {
  return (
    <div className={`w-full ${className}`}>
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
              contentStyle={{
                backgroundColor: "rgba(17, 24, 39, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => tooltipFormatter(value, name)}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}
            />
          )}
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}