import type { InsightAnomaly, InsightCard, InsightInput, ProtocolInsights } from "./types";

const formatToken = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} AXV`;

const formatPercent = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;

function percentDelta(observed: number, expected: number): number {
  if (expected === 0) return observed === 0 ? 0 : 100;
  return ((observed - expected) / Math.abs(expected)) * 100;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function detectInsightAnomalies(input: InsightInput): InsightAnomaly[] {
  const anomalies: InsightAnomaly[] = [];
  const { rewards, apy, flows, participation } = input;

  if (rewards.weekly.length >= 4) {
    const latest = rewards.weekly[rewards.weekly.length - 1].value;
    const baseline = average(rewards.weekly.slice(0, -1).map((point) => point.value));
    const deviation = percentDelta(latest, baseline);

    if (baseline > 0 && Math.abs(deviation) >= 40) {
      anomalies.push({
        id: "reward-velocity-shift",
        metric: "rewards",
        severity: Math.abs(deviation) >= 75 ? "critical" : "warning",
        title: deviation > 0 ? "Rewards spiked above baseline" : "Rewards dropped below baseline",
        description: `Latest weekly rewards are ${formatPercent(Math.abs(deviation))} ${deviation > 0 ? "above" : "below"} the recent average.`,
        observedValue: latest,
        expectedValue: baseline,
        deviationPercent: deviation,
      });
    }
  }

  if (apy.history.length >= 5 && apy.volatility > 4) {
    anomalies.push({
      id: "apy-volatility-elevated",
      metric: "apy",
      severity: apy.volatility >= 8 ? "critical" : "warning",
      title: "APY volatility is elevated",
      description: `APY standard deviation is ${formatPercent(apy.volatility)}, indicating unstable yield conditions.`,
      observedValue: apy.volatility,
      expectedValue: 4,
      deviationPercent: percentDelta(apy.volatility, 4),
    });
  }

  const outflowRatio = flows.deposits.total > 0 ? flows.withdrawals.total / flows.deposits.total : 0;
  if (flows.withdrawals.count > 0 && (flows.netFlow < 0 || outflowRatio >= 0.8)) {
    anomalies.push({
      id: "net-outflow-pressure",
      metric: "flows",
      severity: flows.netFlow < 0 ? "critical" : "warning",
      title: "Withdrawal pressure detected",
      description: `Withdrawals represent ${formatPercent(outflowRatio * 100)} of deposits, with net flow at ${formatToken(flows.netFlow)}.`,
      observedValue: flows.withdrawals.total,
      expectedValue: flows.deposits.total * 0.5,
      deviationPercent: percentDelta(flows.withdrawals.total, flows.deposits.total * 0.5),
    });
  }

  if (participation.totalTransactions > 0 && participation.daysSinceLastInteraction >= 14) {
    anomalies.push({
      id: "participation-lapse",
      metric: "participation",
      severity: participation.daysSinceLastInteraction >= 30 ? "critical" : "warning",
      title: "Protocol activity has lapsed",
      description: `No wallet activity has been recorded for ${participation.daysSinceLastInteraction} days.`,
      observedValue: participation.daysSinceLastInteraction,
      expectedValue: 7,
      deviationPercent: percentDelta(participation.daysSinceLastInteraction, 7),
    });
  }

  return anomalies;
}

export function generateProtocolInsights(input: InsightInput): ProtocolInsights {
  const anomalies = detectInsightAnomalies(input);
  const { rewards, apy, flows, participation } = input;
  const healthScore = Math.max(
    0,
    Math.min(100, participation.activityScore + (flows.netFlow >= 0 ? 10 : -15) + (anomalies.length ? -anomalies.length * 10 : 10))
  );

  const summary = `Protocol activity is ${participation.consistencyRating}, with ${participation.totalTransactions} transactions, ${formatToken(rewards.totalEarned)} earned rewards, and current APY of ${formatPercent(apy.currentAPY)}.`;

  const cards: InsightCard[] = [
    {
      id: "protocol-summary",
      category: "summary",
      severity: healthScore >= 75 ? "success" : healthScore >= 45 ? "info" : "warning",
      title: "Protocol summary",
      description: summary,
      metricLabel: "Health score",
      metricValue: `${Math.round(healthScore)}/100`,
    },
    {
      id: "reward-trend",
      category: "summary",
      severity: rewards.trendDirection === "down" ? "warning" : rewards.trendDirection === "up" ? "success" : "info",
      title: "Reward trend",
      description: `Rewards are trending ${rewards.trendDirection} by ${formatPercent(Math.abs(rewards.trendPercent))} versus the prior window.`,
      metricLabel: "Average daily",
      metricValue: formatToken(rewards.averageDaily),
    },
  ];

  const recommendations: InsightCard[] = [];
  if (participation.activityScore < 50) {
    recommendations.push({
      id: "increase-activity-review",
      category: "recommendation",
      severity: "info",
      title: "Review protocol activity cadence",
      description: "Consider checking vault status more frequently so deposits, rewards, and withdrawals stay aligned with your goals.",
      action: "Open transaction history",
    });
  }
  if (anomalies.some((anomaly) => anomaly.metric === "apy" || anomaly.metric === "rewards")) {
    recommendations.push({
      id: "inspect-yield-drivers",
      category: "recommendation",
      severity: "warning",
      title: "Inspect yield drivers",
      description: "Compare reward cadence, APY movement, and recent transactions before making protocol changes.",
      action: "Review analytics tabs",
    });
  }
  if (flows.netFlow < 0) {
    recommendations.push({
      id: "monitor-liquidity-buffer",
      category: "recommendation",
      severity: "warning",
      title: "Monitor liquidity buffer",
      description: "Net outflows are negative. Validate that upcoming withdrawals and reward claims are expected operational activity.",
      action: "Review flows",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      id: "maintain-monitoring",
      category: "recommendation",
      severity: "success",
      title: "Maintain monitoring rhythm",
      description: "No major anomalies are active. Continue monitoring APY, rewards, and flow changes as new data arrives.",
      action: "Refresh insights",
    });
  }

  return {
    generatedAt: input.lastUpdated,
    summary,
    healthScore,
    cards,
    anomalies,
    recommendations,
  };
}
