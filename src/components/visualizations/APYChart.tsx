/**
 * @module components/visualizations/APYChart
 *
 * APY (Annual Percentage Yield) trend visualization with volatility bands.
 */

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeSeriesDataPoint } from "@/types/analytics";
import { formatPercentage } from "@/services/analytics/calculations";

interface APYChartProps {
  /** APY history */
  data: TimeSeriesDataPoint[];
  /** Chart height */
  height?: number;
  /** Show average line */
  showAverage?: boolean;
  /** Show volatility bands */
  showVolatility?: boolean;
  /** Current APY value */
  currentAPY?: number;
}

export function APYChart({
  data,
  height = 300,
  showAverage = true,
  showVolatility = false,
  currentAPY,
}: APYChartProps) {
  // Calculate statistics
  const { average, volatility, dataWithBands } = useMemo(() => {
    if (data.length === 0) {
      return { average: 0, volatility: 0, dataWithBands: [] };
    }

    const values = data.map((d) => d.value);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate standard deviation
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Add volatility bands to data
    const withBands = data.map((point) => ({
      ...point,
      upperBand: avg + stdDev,
      lowerBand: Math.max(0, avg - stdDev),
    }));

    return {
      average: avg,
      volatility: stdDev,
      dataWithBands: withBands,
    };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-xl">
        <p className="text-sm text-slate-400 mb-2">{data.date}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">APY:</span>
            <span className="text-sm font-semibold text-purple-400">
              {data.value.toFixed(2)}%
            </span>
          </div>
          {showVolatility && (
            <>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-400">Upper Band:</span>
                <span className="text-slate-300">{data.upperBand?.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-400">Lower Band:</span>
                <span className="text-slate-300">{data.lowerBand?.toFixed(2)}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={showVolatility ? dataWithBands : data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="apyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
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
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            width={60}
          />

          <Tooltip content={<CustomTooltip />} />

          {showAverage && (
            <ReferenceLine
              y={average}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `Avg: ${average.toFixed(2)}%`,
                position: "insideTopRight",
                fill: "#94a3b8",
                fontSize: 11,
              }}
            />
          )}

          {currentAPY !== undefined && (
            <ReferenceLine
              y={currentAPY}
              stroke="#a855f7"
              strokeDasharray="6 3"
              strokeOpacity={0.7}
              label={{
                value: `Current: ${currentAPY.toFixed(2)}%`,
                position: "insideTopLeft",
                fill: "#a855f7",
                fontSize: 11,
              }}
            />
          )}

          {/* Volatility bands */}
          {showVolatility && (
            <>
              <Area
                type="monotone"
                dataKey="upperBand"
                stroke="none"
                fill="url(#volatilityGradient)"
                name="Upper Band"
              />
              <Area
                type="monotone"
                dataKey="lowerBand"
                stroke="none"
                fill="url(#volatilityGradient)"
                name="Lower Band"
              />
            </>
          )}

          {/* APY line */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#apyGradient)"
            name="APY"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#a855f7",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentAPY !== undefined && (
          <div className="text-center">
            <p className="text-xs text-slate-400">Current</p>
            <p className="text-lg font-semibold text-purple-400">
              {currentAPY.toFixed(2)}%
            </p>
          </div>
        )}
        <div className="text-center">
          <p className="text-xs text-slate-400">Average</p>
          <p className="text-lg font-semibold text-slate-200">
            {average.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">High</p>
          <p className="text-lg font-semibold text-emerald-400">
            {Math.max(...data.map((d) => d.value)).toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Volatility</p>
          <p className="text-lg font-semibold text-slate-200">
            ±{volatility.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
