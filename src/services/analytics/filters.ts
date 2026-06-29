/**
 * @module services/analytics/filters
 *
 * Filtering and data transformation utilities for analytics.
 * Handles time period filtering, data aggregation, and sampling.
 */

import type {
  TimeSeriesDataPoint,
  AnalyticsFilter,
} from "@/types/analytics";
import { TimePeriod } from "@/types/analytics";

/**
 * Get date range for a time period.
 */
export function getDateRange(period: TimePeriod, customStart?: number, customEnd?: number): {
  start: number;
  end: number;
} {
  const end = customEnd || Date.now();
  let start: number;

  switch (period) {
    case TimePeriod.DAY:
      start = end - 24 * 60 * 60 * 1000;
      break;
    case TimePeriod.WEEK:
      start = end - 7 * 24 * 60 * 60 * 1000;
      break;
    case TimePeriod.MONTH:
      start = end - 30 * 24 * 60 * 60 * 1000;
      break;
    case TimePeriod.QUARTER:
      start = end - 90 * 24 * 60 * 60 * 1000;
      break;
    case TimePeriod.YEAR:
      start = end - 365 * 24 * 60 * 60 * 1000;
      break;
    case TimePeriod.ALL:
      start = 0;
      break;
    default:
      start = customStart || end - 30 * 24 * 60 * 60 * 1000;
  }

  return { start, end };
}

/**
 * Filter time series data by date range.
 */
export function filterByDateRange(
  data: TimeSeriesDataPoint[],
  start: number,
  end: number
): TimeSeriesDataPoint[] {
  return data.filter((point) => point.timestamp >= start && point.timestamp <= end);
}

/**
 * Filter time series data by period.
 */
export function filterByPeriod(
  data: TimeSeriesDataPoint[],
  period: TimePeriod,
  customStart?: number,
  customEnd?: number
): TimeSeriesDataPoint[] {
  const { start, end } = getDateRange(period, customStart, customEnd);
  return filterByDateRange(data, start, end);
}

/**
 * Aggregate data points by time granularity.
 */
export function aggregateByGranularity(
  data: TimeSeriesDataPoint[],
  granularity: "hour" | "day" | "week" | "month"
): TimeSeriesDataPoint[] {
  if (data.length === 0) return [];

  const buckets = new Map<string, TimeSeriesDataPoint[]>();

  data.forEach((point) => {
    const date = new Date(point.timestamp);
    let key: string;

    switch (granularity) {
      case "hour":
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case "day":
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        break;
      case "month":
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      default:
        key = date.toISOString();
    }

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(point);
  });

  // Aggregate each bucket
  return Array.from(buckets.entries())
    .map(([key, points]) => {
      const values = points.map((p) => p.value);
      const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
      const firstPoint = points[0];

      return {
        timestamp: firstPoint.timestamp,
        date: formatDateByGranularity(firstPoint.timestamp, granularity),
        value: avgValue,
        ...Object.keys(firstPoint).reduce((acc, k) => {
          if (k !== "timestamp" && k !== "date" && k !== "value" && typeof firstPoint[k] === "number") {
            const nums = points.map((p) => p[k] as number);
            acc[k] = nums.reduce((sum, n) => sum + n, 0) / nums.length;
          }
          return acc;
        }, {} as Record<string, number>),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Sample data to reduce number of points (for performance).
 */
export function sampleData(
  data: TimeSeriesDataPoint[],
  maxPoints: number
): TimeSeriesDataPoint[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const sampled: TimeSeriesDataPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Always include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
}

/**
 * Smooth data using moving average.
 */
export function smoothData(
  data: TimeSeriesDataPoint[],
  windowSize: number = 7
): TimeSeriesDataPoint[] {
  if (data.length < windowSize) return data;

  const smoothed: TimeSeriesDataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);

    const avgValue = window.reduce((sum, p) => sum + p.value, 0) / window.length;

    smoothed.push({
      ...data[i],
      value: avgValue,
    });
  }

  return smoothed;
}

/**
 * Fill missing data points (interpolation).
 */
export function fillMissingData(
  data: TimeSeriesDataPoint[],
  granularity: "hour" | "day" | "week" | "month"
): TimeSeriesDataPoint[] {
  if (data.length < 2) return data;

  const filled: TimeSeriesDataPoint[] = [];
  const intervalMs = getIntervalMs(granularity);

  for (let i = 0; i < data.length - 1; i++) {
    filled.push(data[i]);

    const currentTime = data[i].timestamp;
    const nextTime = data[i + 1].timestamp;
    const gap = nextTime - currentTime;

    // If gap is larger than interval, fill with interpolated values
    if (gap > intervalMs * 1.5) {
      const steps = Math.floor(gap / intervalMs);
      const currentValue = data[i].value;
      const nextValue = data[i + 1].value;
      const valueStep = (nextValue - currentValue) / (steps + 1);

      for (let j = 1; j <= steps; j++) {
        const interpolatedTime = currentTime + j * intervalMs;
        const interpolatedValue = currentValue + j * valueStep;

        filled.push({
          timestamp: interpolatedTime,
          date: formatDateByGranularity(interpolatedTime, granularity),
          value: interpolatedValue,
        });
      }
    }
  }

  filled.push(data[data.length - 1]);

  return filled;
}

/**
 * Calculate rolling statistics.
 */
export function calculateRollingStats(
  data: TimeSeriesDataPoint[],
  windowSize: number
): TimeSeriesDataPoint[] {
  if (data.length < windowSize) return data;

  return data.map((point, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = data.slice(start, index + 1);
    const values = window.map((p) => p.value);

    const sum = values.reduce((s, v) => s + v, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      ...point,
      rollingAvg: avg,
      rollingMin: min,
      rollingMax: max,
    };
  });
}

/**
 * Apply analytics filter to data.
 */
export function applyFilter(
  data: TimeSeriesDataPoint[],
  filter: AnalyticsFilter
): TimeSeriesDataPoint[] {
  let filtered = data;

  // Apply time period filter
  filtered = filterByPeriod(filtered, filter.period, filter.startDate, filter.endDate);

  // Apply granularity aggregation
  if (filter.granularity) {
    filtered = aggregateByGranularity(filtered, filter.granularity);
  }

  return filtered;
}

/**
 * Get appropriate granularity for a time period.
 */
export function getDefaultGranularity(period: TimePeriod): "hour" | "day" | "week" | "month" {
  switch (period) {
    case TimePeriod.DAY:
      return "hour";
    case TimePeriod.WEEK:
      return "day";
    case TimePeriod.MONTH:
      return "day";
    case TimePeriod.QUARTER:
      return "week";
    case TimePeriod.YEAR:
      return "month";
    case TimePeriod.ALL:
      return "month";
    default:
      return "day";
  }
}

/**
 * Format date based on granularity.
 */
function formatDateByGranularity(timestamp: number, granularity: "hour" | "day" | "week" | "month"): string {
  const date = new Date(timestamp);

  switch (granularity) {
    case "hour":
      return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" });
    case "day":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "week":
      return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "month":
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Get interval in milliseconds for granularity.
 */
function getIntervalMs(granularity: "hour" | "day" | "week" | "month"): number {
  switch (granularity) {
    case "hour":
      return 60 * 60 * 1000;
    case "day":
      return 24 * 60 * 60 * 1000;
    case "week":
      return 7 * 24 * 60 * 60 * 1000;
    case "month":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Get comparison data for previous period.
 */
export function getPreviousPeriodData(
  data: TimeSeriesDataPoint[],
  period: TimePeriod
): TimeSeriesDataPoint[] {
  const { start, end } = getDateRange(period);
  const duration = end - start;
  const previousStart = start - duration;
  const previousEnd = start;

  return filterByDateRange(data, previousStart, previousEnd);
}
