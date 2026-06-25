/**
 * @module services/analytics/calculations
 *
 * Core calculation utilities for analytics metrics.
 * Pure functions for computing performance metrics, statistics, and aggregations.
 */

import type {
  TimeSeriesDataPoint,
  PeriodMetrics,
  TimePeriod,
  VaultPerformance,
  RewardAnalytics,
  FlowAnalytics,
  APYAnalytics,
  ParticipationMetrics,
} from "@/types/analytics";

/**
 * Calculate basic statistics for a dataset.
 */
export function calculateStats(values: number[]): {
  total: number;
  average: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
} {
  if (values.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, median: 0, stdDev: 0 };
  }

  const total = values.reduce((sum, v) => sum + v, 0);
  const average = total / values.length;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    total,
    average,
    min: Math.min(...values),
    max: Math.max(...values),
    median,
    stdDev,
  };
}

/**
 * Calculate period metrics from time series data.
 */
export function calculatePeriodMetrics(
  data: TimeSeriesDataPoint[],
  period: TimePeriod,
  previousData?: TimeSeriesDataPoint[]
): PeriodMetrics {
  if (data.length === 0) {
    return {
      period,
      startDate: Date.now(),
      endDate: Date.now(),
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      change: 0,
      trend: "stable",
    };
  }

  const values = data.map((d) => d.value);
  const stats = calculateStats(values);

  const startDate = data[0].timestamp;
  const endDate = data[data.length - 1].timestamp;

  let change = 0;
  let trend: "up" | "down" | "stable" = "stable";

  if (previousData && previousData.length > 0) {
    const previousAverage = previousData.reduce((sum, d) => sum + d.value, 0) / previousData.length;
    if (previousAverage !== 0) {
      change = ((stats.average - previousAverage) / previousAverage) * 100;
      trend = change > 1 ? "up" : change < -1 ? "down" : "stable";
    }
  } else if (data.length > 1) {
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    if (firstValue !== 0) {
      change = ((lastValue - firstValue) / firstValue) * 100;
      trend = change > 1 ? "up" : change < -1 ? "down" : "stable";
    }
  }

  return {
    period,
    startDate,
    endDate,
    total: stats.total,
    average: stats.average,
    min: stats.min,
    max: stats.max,
    change,
    trend,
  };
}

/**
 * Calculate vault performance metrics.
 */
export function calculateVaultPerformance(
  balanceHistory: TimeSeriesDataPoint[],
  deposits: number,
  withdrawals: number
): VaultPerformance {
  if (balanceHistory.length === 0) {
    return {
      currentValue: 0,
      initialValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      apy: 0,
      timeWeightedReturn: 0,
      sharpeRatio: null,
      balanceHistory: [],
    };
  }

  const currentValue = balanceHistory[balanceHistory.length - 1].value;
  const initialValue = balanceHistory[0].value;

  const netDeposits = deposits - withdrawals;
  const totalReturn = currentValue - initialValue - netDeposits;
  const totalReturnPercent = initialValue > 0 ? (totalReturn / initialValue) * 100 : 0;

  // Calculate APY (annualized)
  const timeSpan = balanceHistory[balanceHistory.length - 1].timestamp - balanceHistory[0].timestamp;
  const yearsElapsed = timeSpan / (365.25 * 24 * 60 * 60 * 1000);
  const apy = yearsElapsed > 0 && initialValue > 0
    ? (Math.pow(currentValue / initialValue, 1 / yearsElapsed) - 1) * 100
    : 0;

  // Calculate time-weighted return
  const returns = [];
  for (let i = 1; i < balanceHistory.length; i++) {
    const prevValue = balanceHistory[i - 1].value;
    const currValue = balanceHistory[i].value;
    if (prevValue > 0) {
      returns.push((currValue - prevValue) / prevValue);
    }
  }

  const avgReturn = returns.length > 0
    ? returns.reduce((sum, r) => sum + r, 0) / returns.length
    : 0;
  const timeWeightedReturn = (avgReturn * 365.25) * 100; // Annualized

  // Calculate Sharpe ratio (simplified, assuming risk-free rate of 0)
  const { stdDev } = calculateStats(returns);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365.25) : null;

  return {
    currentValue,
    initialValue,
    totalReturn,
    totalReturnPercent,
    apy,
    timeWeightedReturn,
    sharpeRatio,
    balanceHistory,
  };
}

/**
 * Calculate reward analytics.
 */
export function calculateRewardAnalytics(
  rewardHistory: TimeSeriesDataPoint[]
): RewardAnalytics {
  if (rewardHistory.length === 0) {
    return {
      totalRewards: 0,
      averageReward: 0,
      rewardFrequency: 0,
      lastRewardDate: null,
      nextRewardDate: null,
      rewardHistory: [],
      rewardsByPeriod: [],
    };
  }

  const stats = calculateStats(rewardHistory.map((r) => r.value));

  // Calculate frequency (average days between rewards)
  const frequencies: number[] = [];
  for (let i = 1; i < rewardHistory.length; i++) {
    const daysBetween = (rewardHistory[i].timestamp - rewardHistory[i - 1].timestamp) / (24 * 60 * 60 * 1000);
    frequencies.push(daysBetween);
  }

  const rewardFrequency = frequencies.length > 0
    ? frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length
    : 0;

  const lastRewardDate = rewardHistory[rewardHistory.length - 1].timestamp;
  const nextRewardDate = rewardFrequency > 0
    ? lastRewardDate + (rewardFrequency * 24 * 60 * 60 * 1000)
    : null;

  // Group by period (monthly)
  const rewardsByPeriod = groupByMonth(rewardHistory).map((monthData, index, arr) => {
    const prevMonthData = index > 0 ? arr[index - 1] : undefined;
    return calculatePeriodMetrics(monthData, TimePeriod.MONTH, prevMonthData);
  });

  return {
    totalRewards: stats.total,
    averageReward: stats.average,
    rewardFrequency,
    lastRewardDate,
    nextRewardDate,
    rewardHistory,
    rewardsByPeriod,
  };
}

/**
 * Calculate flow analytics (deposits/withdrawals).
 */
export function calculateFlowAnalytics(
  depositHistory: TimeSeriesDataPoint[],
  withdrawalHistory: TimeSeriesDataPoint[]
): FlowAnalytics {
  const totalDeposits = depositHistory.reduce((sum, d) => sum + d.value, 0);
  const totalWithdrawals = withdrawalHistory.reduce((sum, w) => sum + w.value, 0);
  const netFlow = totalDeposits - totalWithdrawals;

  // Combine and sort by timestamp
  const combined = [
    ...depositHistory.map((d) => ({ ...d, type: "deposit" as const })),
    ...withdrawalHistory.map((w) => ({ ...w, value: -w.value, type: "withdrawal" as const })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  const flowHistory: TimeSeriesDataPoint[] = combined.map((item) => ({
    timestamp: item.timestamp,
    date: item.date,
    value: item.value,
    type: item.type,
  }));

  const flowByPeriod = groupByMonth(flowHistory).map((monthData, index, arr) => {
    const prevMonthData = index > 0 ? arr[index - 1] : undefined;
    return calculatePeriodMetrics(monthData, TimePeriod.MONTH, prevMonthData);
  });

  return {
    totalDeposits,
    totalWithdrawals,
    netFlow,
    depositHistory,
    withdrawalHistory,
    flowHistory,
    flowByPeriod,
  };
}

/**
 * Calculate APY analytics.
 */
export function calculateAPYAnalytics(
  apyHistory: TimeSeriesDataPoint[]
): APYAnalytics {
  if (apyHistory.length === 0) {
    return {
      current: 0,
      average: 0,
      min: 0,
      max: 0,
      volatility: 0,
      history: [],
      byPeriod: [],
    };
  }

  const stats = calculateStats(apyHistory.map((a) => a.value));

  const byPeriod = groupByMonth(apyHistory).map((monthData, index, arr) => {
    const prevMonthData = index > 0 ? arr[index - 1] : undefined;
    return calculatePeriodMetrics(monthData, TimePeriod.MONTH, prevMonthData);
  });

  return {
    current: apyHistory[apyHistory.length - 1].value,
    average: stats.average,
    min: stats.min,
    max: stats.max,
    volatility: stats.stdDev,
    history: apyHistory,
    byPeriod,
  };
}

/**
 * Calculate participation metrics.
 */
export function calculateParticipationMetrics(
  transactions: Array<{ timestamp: number; amount: number }>
): ParticipationMetrics {
  if (transactions.length === 0) {
    return {
      activeDays: 0,
      transactionCount: 0,
      avgTransactionSize: 0,
      largestTransaction: 0,
      firstTransactionDate: null,
      lastTransactionDate: null,
      transactionFrequency: 0,
      engagementScore: 0,
    };
  }

  // Count unique days
  const uniqueDays = new Set(
    transactions.map((t) => new Date(t.timestamp).toDateString())
  );

  const amounts = transactions.map((t) => Math.abs(t.amount));
  const stats = calculateStats(amounts);

  const firstTransactionDate = transactions[0].timestamp;
  const lastTransactionDate = transactions[transactions.length - 1].timestamp;

  const totalDays = (lastTransactionDate - firstTransactionDate) / (24 * 60 * 60 * 1000);
  const transactionFrequency = transactions.length > 1
    ? totalDays / transactions.length
    : 0;

  // Calculate engagement score (0-100)
  const recencyScore = Math.min((Date.now() - lastTransactionDate) / (30 * 24 * 60 * 60 * 1000), 1);
  const frequencyScore = Math.min(transactions.length / 100, 1);
  const consistencyScore = uniqueDays.size / Math.max(totalDays, 1);
  const engagementScore = Math.round((1 - recencyScore * 0.4 + frequencyScore * 0.3 + consistencyScore * 0.3) * 100);

  return {
    activeDays: uniqueDays.size,
    transactionCount: transactions.length,
    avgTransactionSize: stats.average,
    largestTransaction: stats.max,
    firstTransactionDate,
    lastTransactionDate,
    transactionFrequency,
    engagementScore: Math.max(0, Math.min(100, engagementScore)),
  };
}

/**
 * Group time series data by month.
 */
function groupByMonth(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[][] {
  const groups = new Map<string, TimeSeriesDataPoint[]>();

  data.forEach((point) => {
    const date = new Date(point.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(point);
  });

  return Array.from(groups.values());
}

/**
 * Format number as currency.
 */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage.
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B).
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}
