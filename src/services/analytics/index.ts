/**
 * @module services/analytics
 *
 * Main analytics service that orchestrates data fetching, calculations, and transformations.
 * Provides a unified interface for retrieving analytics data.
 */

import type {
  AnalyticsData,
  AnalyticsFilter,
  TimeSeriesDataPoint,
  TimePeriod,
} from "@/types/analytics";
import {
  calculateVaultPerformance,
  calculateRewardAnalytics,
  calculateFlowAnalytics,
  calculateAPYAnalytics,
  calculateParticipationMetrics,
} from "./calculations";
import { generateAnalyticsForecasts } from "./forecasting";
import {
  applyFilter,
  filterByPeriod,
  aggregateByGranularity,
  getDefaultGranularity,
  sampleData,
  smoothData,
} from "./filters";

/**
 * Mock data generator for development.
 * In production, this would fetch from the blockchain or backend API.
 */
function generateMockBalanceHistory(days: number = 90): TimeSeriesDataPoint[] {
  const now = Date.now();
  const data: TimeSeriesDataPoint[] = [];

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const date = new Date(timestamp);
    const value = 10000 + Math.random() * 2000 + i * 50; // Upward trend with noise

    data.push({
      timestamp,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
    });
  }

  return data;
}

function generateMockRewardHistory(days: number = 90): TimeSeriesDataPoint[] {
  const now = Date.now();
  const data: TimeSeriesDataPoint[] = [];

  // Generate rewards every 7 days
  for (let i = days; i >= 0; i -= 7) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const date = new Date(timestamp);
    const value = 50 + Math.random() * 30;

    data.push({
      timestamp,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
    });
  }

  return data;
}

function generateMockFlowHistory(days: number = 90): {
  deposits: TimeSeriesDataPoint[];
  withdrawals: TimeSeriesDataPoint[];
} {
  const now = Date.now();
  const deposits: TimeSeriesDataPoint[] = [];
  const withdrawals: TimeSeriesDataPoint[] = [];

  // Generate random deposits and withdrawals
  for (let i = days; i >= 0; i -= 10) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const date = new Date(timestamp);

    if (Math.random() > 0.3) {
      deposits.push({
        timestamp,
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: 500 + Math.random() * 1000,
      });
    }

    if (Math.random() > 0.6) {
      withdrawals.push({
        timestamp: timestamp + Math.random() * 5 * 24 * 60 * 60 * 1000,
        date: new Date(timestamp + Math.random() * 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        ),
        value: 300 + Math.random() * 700,
      });
    }
  }

  return {
    deposits: deposits.sort((a, b) => a.timestamp - b.timestamp),
    withdrawals: withdrawals.sort((a, b) => a.timestamp - b.timestamp),
  };
}

function generateMockAPYHistory(days: number = 90): TimeSeriesDataPoint[] {
  const now = Date.now();
  const data: TimeSeriesDataPoint[] = [];
  let baseAPY = 8;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const date = new Date(timestamp);

    // APY changes gradually with some volatility
    baseAPY += (Math.random() - 0.5) * 0.5;
    baseAPY = Math.max(5, Math.min(15, baseAPY)); // Keep between 5-15%

    data.push({
      timestamp,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: baseAPY,
    });
  }

  return data;
}

/**
 * Fetch complete analytics data for a user's vault activity.
 * 
 * @param address - Wallet address
 * @param filter - Optional filter for time period and metrics
 * @returns Complete analytics data
 */
export async function fetchAnalyticsData(
  address: string,
  filter?: AnalyticsFilter
): Promise<AnalyticsData> {
  // TODO: Replace with actual blockchain/API calls
  // For now, generate mock data

  // Generate raw data
  const rawBalanceHistory = generateMockBalanceHistory(365);
  const rawRewardHistory = generateMockRewardHistory(365);
  const rawAPYHistory = generateMockAPYHistory(365);
  const { deposits: rawDeposits, withdrawals: rawWithdrawals } =
    generateMockFlowHistory(365);

  // Apply filters if provided
  let balanceHistory = rawBalanceHistory;
  let rewardHistory = rawRewardHistory;
  let apyHistory = rawAPYHistory;
  let deposits = rawDeposits;
  let withdrawals = rawWithdrawals;

  if (filter) {
    balanceHistory = applyFilter(rawBalanceHistory, filter);
    rewardHistory = applyFilter(rawRewardHistory, filter);
    apyHistory = applyFilter(rawAPYHistory, filter);
    deposits = applyFilter(rawDeposits, filter);
    withdrawals = applyFilter(rawWithdrawals, filter);
  }

  // Calculate total deposits and withdrawals
  const totalDeposits = deposits.reduce((sum, d) => sum + d.value, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.value, 0);

  // Calculate analytics
  const performance = calculateVaultPerformance(
    balanceHistory,
    totalDeposits,
    totalWithdrawals
  );

  const rewards = calculateRewardAnalytics(rewardHistory);

  const flow = calculateFlowAnalytics(deposits, withdrawals);

  const apy = calculateAPYAnalytics(apyHistory);

  // Generate mock transactions for participation metrics
  const transactions = [
    ...deposits.map((d) => ({ timestamp: d.timestamp, amount: d.value })),
    ...withdrawals.map((w) => ({ timestamp: w.timestamp, amount: -w.value })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  const participation = calculateParticipationMetrics(transactions);

  const forecasts = generateAnalyticsForecasts({
    balanceHistory: performance.balanceHistory,
    rewardHistory: rewards.rewardHistory,
    apyHistory: apy.history,
    flowHistory: flow.flowHistory,
  });

  return {
    performance,
    rewards,
    flow,
    apy,
    participation,
    forecasts,
    lastUpdated: Date.now(),
  };
}

/**
 * Get filtered balance history with optional smoothing and sampling.
 */
export async function getBalanceHistory(
  address: string,
  period: TimePeriod = TimePeriod.MONTH,
  options: {
    smooth?: boolean;
    sample?: number;
    granularity?: "hour" | "day" | "week" | "month";
  } = {}
): Promise<TimeSeriesDataPoint[]> {
  const rawData = generateMockBalanceHistory(365);

  // Filter by period
  let filtered = filterByPeriod(rawData, period);

  // Apply granularity
  if (options.granularity) {
    filtered = aggregateByGranularity(filtered, options.granularity);
  }

  // Apply smoothing
  if (options.smooth) {
    filtered = smoothData(filtered);
  }

  // Apply sampling
  if (options.sample && filtered.length > options.sample) {
    filtered = sampleData(filtered, options.sample);
  }

  return filtered;
}

/**
 * Get reward distribution for a period.
 */
export async function getRewardDistribution(
  address: string,
  period: TimePeriod = TimePeriod.MONTH
): Promise<TimeSeriesDataPoint[]> {
  const rawData = generateMockRewardHistory(365);
  return filterByPeriod(rawData, period);
}

/**
 * Get flow analysis (deposits/withdrawals).
 */
export async function getFlowAnalysis(
  address: string,
  period: TimePeriod = TimePeriod.MONTH
): Promise<{
  deposits: TimeSeriesDataPoint[];
  withdrawals: TimeSeriesDataPoint[];
}> {
  const { deposits, withdrawals } = generateMockFlowHistory(365);

  return {
    deposits: filterByPeriod(deposits, period),
    withdrawals: filterByPeriod(withdrawals, period),
  };
}

/**
 * Get APY history.
 */
export async function getAPYHistory(
  address: string,
  period: TimePeriod = TimePeriod.MONTH
): Promise<TimeSeriesDataPoint[]> {
  const rawData = generateMockAPYHistory(365);
  return filterByPeriod(rawData, period);
}

/**
 * Export analytics data to various formats.
 */
export async function exportAnalyticsData(
  address: string,
  format: "csv" | "json" = "json"
): Promise<string> {
  const data = await fetchAnalyticsData(address);

  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  // CSV export (simplified)
  const csvRows = [
    ["Metric", "Value"],
    ["Current Balance", data.performance.currentValue.toString()],
    ["Total Return", `${data.performance.totalReturnPercent.toFixed(2)}%`],
    ["APY", `${data.performance.apy.toFixed(2)}%`],
    ["Total Rewards", data.rewards.totalRewards.toString()],
    ["Total Deposits", data.flow.totalDeposits.toString()],
    ["Total Withdrawals", data.flow.totalWithdrawals.toString()],
    ["Net Flow", data.flow.netFlow.toString()],
    ["Active Days", data.participation.activeDays.toString()],
    ["Engagement Score", data.participation.engagementScore.toString()],
  ];

  return csvRows.map((row) => row.join(",")).join("\n");
}

// Re-export utilities for convenience
export * from "./calculations";
export * from "./filters";
export * from "./forecasting";
