import { detectInsightAnomalies, generateProtocolInsights } from "@/insights/generator";
import type { InsightInput } from "@/insights/types";

const baseInput: InsightInput = {
  lastUpdated: 1710000000000,
  rewards: {
    daily: [],
    weekly: [
      { timestamp: 1, date: "W1", value: 100 },
      { timestamp: 2, date: "W2", value: 105 },
      { timestamp: 3, date: "W3", value: 95 },
      { timestamp: 4, date: "W4", value: 40 },
    ],
    monthly: [],
    totalEarned: 340,
    averageDaily: 12,
    trendDirection: "down",
    trendPercent: -45,
  },
  apy: {
    history: [
      { timestamp: 1, date: "D1", apy: 6, rewardRate: 1 },
      { timestamp: 2, date: "D2", apy: 16, rewardRate: 1 },
      { timestamp: 3, date: "D3", apy: 5, rewardRate: 1 },
      { timestamp: 4, date: "D4", apy: 18, rewardRate: 1 },
      { timestamp: 5, date: "D5", apy: 7, rewardRate: 1 },
    ],
    currentAPY: 7,
    averageAPY: 10.4,
    maxAPY: 18,
    minAPY: 5,
    volatility: 5.2,
  },
  flows: {
    deposits: { total: 1000, count: 2, average: 500, largest: 700, history: [] },
    withdrawals: { total: 1200, count: 3, average: 400, largest: 500, history: [] },
    netFlow: -200,
    flowHistory: [],
  },
  participation: {
    totalTransactions: 5,
    uniqueDaysActive: 3,
    firstInteraction: "2024-01-01",
    lastInteraction: "2024-01-20",
    daysSinceLastInteraction: 21,
    activityScore: 42,
    consistencyRating: "moderate",
    weeklyActivity: [],
    monthlyActivity: [],
  },
};

describe("protocol insight generation", () => {
  it("detects reward, APY, flow, and participation anomalies", () => {
    const anomalies = detectInsightAnomalies(baseInput);

    expect(anomalies.map((anomaly) => anomaly.id)).toEqual(
      expect.arrayContaining([
        "reward-velocity-shift",
        "apy-volatility-elevated",
        "net-outflow-pressure",
        "participation-lapse",
      ])
    );
  });

  it("generates summary cards and dynamic recommendations", () => {
    const insights = generateProtocolInsights(baseInput);

    expect(insights.summary).toContain("Protocol activity is moderate");
    expect(insights.cards).toHaveLength(2);
    expect(insights.recommendations.map((card) => card.id)).toEqual(
      expect.arrayContaining([
        "increase-activity-review",
        "inspect-yield-drivers",
        "monitor-liquidity-buffer",
      ])
    );
    expect(insights.healthScore).toBeLessThan(50);
  });

  it("returns a maintain-monitoring recommendation when no anomalies are active", () => {
    const stableInput: InsightInput = {
      ...baseInput,
      rewards: {
        ...baseInput.rewards,
        weekly: [
          { timestamp: 1, date: "W1", value: 100 },
          { timestamp: 2, date: "W2", value: 102 },
          { timestamp: 3, date: "W3", value: 98 },
          { timestamp: 4, date: "W4", value: 101 },
        ],
        trendDirection: "flat",
        trendPercent: 1,
      },
      apy: { ...baseInput.apy, volatility: 1.5 },
      flows: {
        ...baseInput.flows,
        deposits: { ...baseInput.flows.deposits, total: 2000 },
        withdrawals: { ...baseInput.flows.withdrawals, total: 500, count: 1 },
        netFlow: 1500,
      },
      participation: {
        ...baseInput.participation,
        daysSinceLastInteraction: 2,
        activityScore: 82,
        consistencyRating: "excellent",
      },
    };

    const insights = generateProtocolInsights(stableInput);

    expect(insights.anomalies).toHaveLength(0);
    expect(insights.recommendations).toHaveLength(1);
    expect(insights.recommendations[0].id).toBe("maintain-monitoring");
  });
});
