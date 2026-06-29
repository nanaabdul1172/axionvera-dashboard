# AI-Powered Protocol Insights

The protocol insights pipeline transforms dashboard analytics into a reusable panel with summaries, anomaly detection, and recommendation cards. It is intentionally deterministic and runs in the browser against already-available dashboard metrics; it does not train or call a machine learning model.

## Workflow

1. `useAnalytics` collects portfolio metrics from vault transactions and SDK analytics.
2. `useProtocolInsights` memoizes the insight generation step for the latest analytics payload.
3. `generateProtocolInsights` creates a protocol summary, health score, anomaly list, and recommendations.
4. `ProtocolInsightsPanel` renders the cards above the analytics tabs so the user can review context before drilling into charts.

## Detection methodology

The detector flags:

- weekly reward changes that deviate at least 40% from the previous weekly baseline;
- APY volatility above 4 percentage points;
- withdrawal pressure when net flow is negative or withdrawals are at least 80% of deposits;
- participation lapses when a wallet has been inactive for at least 14 days.

Severity increases when deviations exceed stronger thresholds, such as reward movement above 75%, APY volatility above 8 percentage points, negative net flow, or inactivity above 30 days.

## Recommendation behavior

Recommendations are generated from the active insight state. Low activity prompts cadence review, yield anomalies prompt analytics review, net outflows prompt liquidity monitoring, and stable conditions produce a maintain-monitoring card.
