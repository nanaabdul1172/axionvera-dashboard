import React, { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MetricForecast } from "@/types/analytics";

interface ForecastChartProps {
  forecast: MetricForecast;
  title?: string;
  height?: number;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  className?: string;
}

interface ForecastChartPoint {
  label: string;
  historical?: number;
  predicted?: number;
  lowerBound?: number;
  bandWidth?: number;
}

function defaultNumberFormatter(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function ForecastChart({
  forecast,
  title = "Forecast",
  height = 320,
  yAxisFormatter = defaultNumberFormatter,
  tooltipFormatter = defaultNumberFormatter,
  className = "",
}: ForecastChartProps) {
  const data = useMemo<ForecastChartPoint[]>(() => {
    const historicalPoints = forecast.historical.map((point) => ({
      label: point.date,
      historical: point.value,
      predicted: undefined,
      lowerBound: undefined,
      bandWidth: undefined,
    }));

    const forecastPoints = forecast.forecast.map((point) => ({
      label: point.date,
      historical: undefined,
      predicted: point.predicted,
      lowerBound: point.lowerBound,
      bandWidth: Math.max(0, point.upperBound - point.lowerBound),
    }));

    return [...historicalPoints, ...forecastPoints];
  }, [forecast]);

  const transitionLabel = useMemo(() => {
    if (forecast.historical.length === 0) return undefined;
    return forecast.historical[forecast.historical.length - 1].date;
  }, [forecast.historical]);

  const isInsufficientData = forecast.forecast.length === 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-slate-100">{title}</h4>
        <span
          className={`px-2.5 py-1 text-xs rounded-full border ${
            forecast.confidenceTier === "high"
              ? "bg-emerald-950/50 text-emerald-300 border-emerald-700"
              : forecast.confidenceTier === "medium"
                ? "bg-amber-950/40 text-amber-300 border-amber-700"
                : "bg-rose-950/40 text-rose-300 border-rose-700"
          }`}
        >
          Confidence: {(forecast.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {isInsufficientData ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
          Not enough historical data to generate a forecast.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
              minTickGap={45}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={yAxisFormatter}
              width={72}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(100, 116, 139, 0.4)",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              formatter={(value: number | string) => {
                const numericValue = typeof value === "number" ? value : Number(value);
                return [tooltipFormatter(numericValue), ""];
              }}
            />

            {transitionLabel && (
              <ReferenceLine
                x={transitionLabel}
                stroke="rgba(148, 163, 184, 0.6)"
                strokeDasharray="5 5"
                label={{ value: "Forecast start", fill: "#94a3b8", fontSize: 11 }}
              />
            )}

            <Area
              type="monotone"
              dataKey="lowerBound"
              stackId="confidence"
              stroke="none"
              fill="transparent"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bandWidth"
              stackId="confidence"
              stroke="none"
              fill="rgba(14, 165, 233, 0.24)"
              connectNulls={false}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="historical"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              name="Historical"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#0ea5e9"
              strokeDasharray="6 4"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              name="Forecast"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
