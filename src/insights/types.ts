import type { PortfolioAnalytics } from "@/hooks/useAnalytics";

export type InsightSeverity = "info" | "success" | "warning" | "critical";
export type InsightCategory = "summary" | "anomaly" | "recommendation";

export interface InsightCard {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  metricLabel?: string;
  metricValue?: string;
  action?: string;
}

export interface InsightAnomaly {
  id: string;
  severity: Extract<InsightSeverity, "warning" | "critical">;
  metric: "rewards" | "apy" | "flows" | "participation";
  title: string;
  description: string;
  observedValue: number;
  expectedValue: number;
  deviationPercent: number;
}

export interface ProtocolInsights {
  generatedAt: number;
  summary: string;
  healthScore: number;
  cards: InsightCard[];
  anomalies: InsightAnomaly[];
  recommendations: InsightCard[];
}

export type InsightInput = Pick<
  PortfolioAnalytics,
  "rewards" | "apy" | "flows" | "participation" | "lastUpdated"
>;
