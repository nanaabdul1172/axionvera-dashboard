/**
 * @module components/visualizations/FlowChart
 *
 * Visualization for deposits and withdrawals flow analysis.
 */

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeSeriesDataPoint } from "@/types/analytics";
import { formatCurrency } from "@/services/analytics/calculations";

interface FlowChartProps {
  /** Deposit history */
  deposits: TimeSeriesDataPoint[];
  /** Withdrawal history */
  withdrawals: TimeSeriesDataPoint[];
  /** Chart height */
  height?: number;
  /** Show net flow line */
  showNetFlow?: boolean;
}

export function FlowChart({
  deposits,
  withdrawals,
  height = 350,
  showNetFlow = true,
}: FlowChartProps) {
  // Combine deposits and withdrawals
  const combinedData = useMemo(() => {
    const depositMap = new Map(deposits.map((d) => [d.date, d.value]));
    const withdrawalMap = new Map(withdrawals.map((w) => [w.date, w.value]));

    const allDates = new Set([
      ...deposits.map((d) => d.date),
      ...withdrawals.map((w) => w.date),
    ]);

    return Array.from(allDates)
      .map((date) => {
        const depositVal = depositMap.get(date) || 0;
        const withdrawalVal = withdrawalMap.get(date) || 0;
        return {
          date,
          deposits: depositVal,
          withdrawals: withdrawalVal,
          netFlow: depositVal - withdrawalVal,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [deposits, withdrawals]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-xl">
        <p className="text-sm text-slate-400 mb-2">{data.date}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-emerald-400">Deposits:</span>
            <span className="text-sm font-semibold text-white">
              +{formatCurrency(data.deposits)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-red-400">Withdrawals:</span>
            <span className="text-sm font-semibold text-white">
              -{formatCurrency(data.withdrawals)}
            </span>
          </div>
          {showNetFlow && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
              <span className="text-sm text-slate-300">Net Flow:</span>
              <span
                className={`text-sm font-semibold ${
                  data.netFlow >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {data.netFlow >= 0 ? "+" : ""}
                {formatCurrency(data.netFlow)}
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
        <BarChart
          data={combinedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          barGap={2}
        >
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
            tickFormatter={(value) => formatCurrency(Math.abs(value), 0)}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => (
              <span className="text-sm text-slate-300 capitalize">{value}</span>
            )}
          />

          <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />

          <Bar
            dataKey="deposits"
            fill="#10b981"
            name="Deposits"
            radius={[4, 4, 0, 0]}
          />

          <Bar
            dataKey="withdrawals"
            fill="#ef4444"
            name="Withdrawals"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
