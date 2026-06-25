/**
 * @module components/visualizations/PerformanceChart
 *
 * Advanced performance visualization with multiple metrics and interactive features.
 */

import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeSeriesDataPoint, TimePeriod } from "@/types/analytics";
import { formatCurrency, formatPercentage } from "@/services/analytics/calculations";

interface PerformanceChartProps {
  /** Balance history data */
  balanceData: TimeSeriesDataPoint[];
  /** Reward history data (optional) */
  rewardData?: TimeSeriesDataPoint[];
  /** Show rewards overlay */
  showRewards?: boolean;
  /** Show average line */
  showAverage?: boolean;
  /** Chart height */
  height?: number;
  /** Time period */
  period?: TimePeriod;
  /** Interactive mode */
  interactive?: boolean;
}

export function PerformanceChart({
  balanceData,
  rewardData,
  showRewards = true,
  showAverage = true,
  height = 400,
  period,
  interactive = true,
}: PerformanceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Combine balance and reward data
  const combinedData = useMemo(() => {
    if (!showRewards || !rewardData) return balanceData;

    const rewardMap = new Map(rewardData.map((r) => [r.date, r.value]));

    return balanceData.map((point) => ({
      ...point,
      reward: rewardMap.get(point.date) || 0,
    }));
  }, [balanceData, rewardData, showRewards]);

  // Calculate average
  const average = useMemo(() => {
    if (!showAverage || balanceData.length === 0) return null;
    return balanceData.reduce((sum, p) => sum + p.value, 0) / balanceData.length;
  }, [balanceData, showAverage]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-xl">
        <p className="text-sm text-slate-400 mb-2">{data.date}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">Balance:</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(data.value)} XLM
            </span>
          </div>
          {data.reward && data.reward > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-300">Reward:</span>
              <span className="text-sm font-semibold text-emerald-400">
                +{formatCurrency(data.reward)} XLM
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={combinedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onMouseMove={(e: any) => {
            if (interactive && e && e.activeTooltipIndex !== undefined) {
              setHoveredPoint(e.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => interactive && setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            minTickGap={50}
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value, 0)}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="line"
            formatter={(value) => (
              <span className="text-sm text-slate-300">{value}</span>
            )}
          />

          {average !== null && (
            <ReferenceLine
              y={average}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `Avg: ${formatCurrency(average)}`,
                position: "insideTopRight",
                fill: "#94a3b8",
                fontSize: 11,
              }}
            />
          )}

          {/* Balance area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            name="Balance"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#6366f1",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />

          {/* Rewards line */}
          {showRewards && rewardData && (
            <Line
              type="monotone"
              dataKey="reward"
              stroke="#10b981"
              strokeWidth={2}
              name="Rewards"
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{
                r: 6,
                fill: "#10b981",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Stats summary */}
      {balanceData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-400">Current</p>
            <p className="text-lg font-semibold text-slate-200">
              {formatCurrency(balanceData[balanceData.length - 1].value)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Initial</p>
            <p className="text-lg font-semibold text-slate-200">
              {formatCurrency(balanceData[0].value)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Change</p>
            <p className="text-lg font-semibold text-emerald-400">
              {formatPercentage(
                ((balanceData[balanceData.length - 1].value - balanceData[0].value) /
                  balanceData[0].value) *
                  100
              )}
            </p>
          </div>
          {average && (
            <div className="text-center">
              <p className="text-xs text-slate-400">Average</p>
              <p className="text-lg font-semibold text-slate-200">
                {formatCurrency(average)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
