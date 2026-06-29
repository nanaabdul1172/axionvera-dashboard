/**
 * @module types/analytics
 *
 * Type definitions for analytics and visualization system.
 * Defines data structures for metrics, time series, filters, and chart configurations.
 */

/**
 * Time period for data aggregation and filtering.
 */
export enum TimePeriod {
  DAY = "24h",
  WEEK = "7d",
  MONTH = "30d",
  QUARTER = "90d",
  YEAR = "1y",
  ALL = "all",
}

/**
 * Metric types for performance calculations.
 */
export enum MetricType {
  BALANCE = "balance",
  DEPOSITS = "deposits",
  WITHDRAWALS = "withdrawals",
  REWARDS = "rewards",
  APY = "apy",
  VOLUME = "volume",
  TRANSACTIONS = "transactions",
  NET_FLOW = "net_flow",
}

/**
 * Chart types supported by the visualization system.
 */
export enum ChartType {
  LINE = "line",
  AREA = "area",
  BAR = "bar",
  COMPOSED = "composed",
  PIE = "pie",
}

/**
 * Forecast model types supported by the analytics engine.
 */
export enum ForecastModel {
  MOVING_AVERAGE = "moving_average",
  LINEAR_TREND = "linear_trend",
  ENSEMBLE = "ensemble",
}

/**
 * Forecast horizon for projection windows.
 */
export enum ForecastHorizon {
  WEEK = "7d",
  MONTH = "30d",
  QUARTER = "90d",
}

/**
 * Time series data point with timestamp and value.
 */
export interface TimeSeriesDataPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Formatted date string for display */
  date: string;
  /** Primary value */
  value: number;
  /** Optional secondary values */
  [key: string]: number | string;
}

/**
 * Forecast point with confidence interval.
 */
export interface ForecastPoint extends TimeSeriesDataPoint {
  /** Forecasted value */
  predicted: number;
  /** Lower confidence bound */
  lowerBound: number;
  /** Upper confidence bound */
  upperBound: number;
  /** Point-level confidence score (0-1) */
  confidence: number;
}

/**
 * Forecast confidence tier for simplified display.
 */
export type ForecastConfidenceTier = "high" | "medium" | "low";

/**
 * Metadata about forecast assumptions and quality.
 */
export interface ForecastMetadata {
  /** Data points used to train the forecast */
  dataPointsUsed: number;
  /** Volatility score derived from historical variation */
  volatilityScore: number;
  /** Root mean square error from in-sample fitting */
  rmse: number;
  /** Chosen model */
  model: ForecastModel;
  /** Method assumptions for transparency */
  assumptions: string[];
}

/**
 * Metric-specific forecast payload.
 */
export interface MetricForecast {
  /** Metric identifier (balance, rewards, etc.) */
  metric: "balance" | "rewards" | "apy" | "net_flow";
  /** Forecast horizon */
  horizon: ForecastHorizon;
  /** Historical points used as model input */
  historical: TimeSeriesDataPoint[];
  /** Forecast points */
  forecast: ForecastPoint[];
  /** Aggregate confidence score (0-1) */
  confidence: number;
  /** Confidence tier for UI */
  confidenceTier: ForecastConfidenceTier;
  /** Quality and model metadata */
  metadata: ForecastMetadata;
}

/**
 * Forecast collection for major analytics metrics.
 */
export interface AnalyticsForecasts {
  performance: MetricForecast;
  rewards: MetricForecast;
  apy: MetricForecast;
  flow: MetricForecast;
}

/**
 * Aggregated metrics for a specific time period.
 */
export interface PeriodMetrics {
  /** Time period this metric covers */
  period: TimePeriod;
  /** Start timestamp */
  startDate: number;
  /** End timestamp */
  endDate: number;
  /** Total value for the period */
  total: number;
  /** Average value */
  average: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Change from previous period (percentage) */
  change: number;
  /** Trend direction */
  trend: "up" | "down" | "stable";
}

/**
 * Vault performance metrics.
 */
export interface VaultPerformance {
  /** Current total value */
  currentValue: number;
  /** Initial deposit value */
  initialValue: number;
  /** Total return (absolute) */
  totalReturn: number;
  /** Total return (percentage) */
  totalReturnPercent: number;
  /** Annual percentage yield */
  apy: number;
  /** Time-weighted return rate */
  timeWeightedReturn: number;
  /** Sharpe ratio (risk-adjusted return) */
  sharpeRatio: number | null;
  /** Historical balances */
  balanceHistory: TimeSeriesDataPoint[];
}

/**
 * Reward distribution analytics.
 */
export interface RewardAnalytics {
  /** Total rewards earned */
  totalRewards: number;
  /** Average reward per period */
  averageReward: number;
  /** Reward frequency (days between rewards) */
  rewardFrequency: number;
  /** Last reward date */
  lastRewardDate: number | null;
  /** Next expected reward date (estimated) */
  nextRewardDate: number | null;
  /** Reward history */
  rewardHistory: TimeSeriesDataPoint[];
  /** Reward distribution by period */
  rewardsByPeriod: PeriodMetrics[];
}

/**
 * Transaction flow analytics.
 */
export interface FlowAnalytics {
  /** Total deposits */
  totalDeposits: number;
  /** Total withdrawals */
  totalWithdrawals: number;
  /** Net flow (deposits - withdrawals) */
  netFlow: number;
  /** Deposit history */
  depositHistory: TimeSeriesDataPoint[];
  /** Withdrawal history */
  withdrawalHistory: TimeSeriesDataPoint[];
  /** Combined flow history */
  flowHistory: TimeSeriesDataPoint[];
  /** Flow by period */
  flowByPeriod: PeriodMetrics[];
}

/**
 * APY (Annual Percentage Yield) analytics.
 */
export interface APYAnalytics {
  /** Current APY */
  current: number;
  /** Average APY over period */
  average: number;
  /** Minimum APY */
  min: number;
  /** Maximum APY */
  max: number;
  /** APY volatility (standard deviation) */
  volatility: number;
  /** Historical APY */
  history: TimeSeriesDataPoint[];
  /** APY by period */
  byPeriod: PeriodMetrics[];
}

/**
 * Participation metrics for user engagement.
 */
export interface ParticipationMetrics {
  /** Number of active days */
  activeDays: number;
  /** Total transactions */
  transactionCount: number;
  /** Average transaction size */
  avgTransactionSize: number;
  /** Largest transaction */
  largestTransaction: number;
  /** First transaction date */
  firstTransactionDate: number | null;
  /** Last transaction date */
  lastTransactionDate: number | null;
  /** Transaction frequency (avg days between) */
  transactionFrequency: number;
  /** Engagement score (0-100) */
  engagementScore: number;
}

/**
 * Comprehensive analytics data.
 */
export interface AnalyticsData {
  /** Vault performance metrics */
  performance: VaultPerformance;
  /** Reward analytics */
  rewards: RewardAnalytics;
  /** Flow analytics */
  flow: FlowAnalytics;
  /** APY analytics */
  apy: APYAnalytics;
  /** Participation metrics */
  participation: ParticipationMetrics;
  /** Forward-looking forecasts by metric */
  forecasts: AnalyticsForecasts;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Filter configuration for analytics queries.
 */
export interface AnalyticsFilter {
  /** Time period to analyze */
  period: TimePeriod;
  /** Metric types to include */
  metrics: MetricType[];
  /** Start date (custom period) */
  startDate?: number;
  /** End date (custom period) */
  endDate?: number;
  /** Granularity for time series (hours, days, weeks) */
  granularity?: "hour" | "day" | "week" | "month";
  /** Include comparison with previous period */
  includeComparison?: boolean;
}

/**
 * Chart configuration for visualization.
 */
export interface ChartConfig {
  /** Chart type */
  type: ChartType;
  /** Chart title */
  title: string;
  /** Chart subtitle (optional) */
  subtitle?: string;
  /** Primary data key */
  dataKey: string;
  /** Secondary data keys (for composed charts) */
  secondaryKeys?: string[];
  /** Color scheme */
  colors: string[];
  /** Show grid lines */
  showGrid?: boolean;
  /** Show tooltip */
  showTooltip?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show average line */
  showAverage?: boolean;
  /** Y-axis formatter */
  yAxisFormatter?: (value: number) => string;
  /** Tooltip formatter */
  tooltipFormatter?: (value: number) => string;
  /** Height in pixels */
  height?: number;
  /** Enable interactive features */
  interactive?: boolean;
}

/**
 * Comparison data structure for period-over-period analysis.
 */
export interface ComparisonData {
  /** Current period data */
  current: PeriodMetrics;
  /** Previous period data */
  previous: PeriodMetrics;
  /** Absolute change */
  absoluteChange: number;
  /** Percentage change */
  percentageChange: number;
  /** Trend indicator */
  trend: "improving" | "declining" | "stable";
}

/**
 * Export configuration for data export.
 */
export interface ExportConfig {
  /** Export format */
  format: "csv" | "json" | "xlsx";
  /** Include metadata */
  includeMetadata?: boolean;
  /** Fields to include */
  fields?: string[];
  /** Date range */
  dateRange?: {
    start: number;
    end: number;
  };
}
