/**
 * @module services/analytics/forecasting
 *
 * Deterministic forecasting utilities based on historical time series.
 * Uses lightweight models suitable for client-side analytics without model training.
 */

import {
    ForecastHorizon,
    ForecastModel,
    type ForecastPoint,
    type MetricForecast,
    type TimeSeriesDataPoint,
    type AnalyticsForecasts,
} from "@/types/analytics";

interface RegressionModel {
    slope: number;
    intercept: number;
}

const MIN_FORECAST_POINTS = 8;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function getHorizonDays(horizon: ForecastHorizon): number {
    switch (horizon) {
        case ForecastHorizon.WEEK:
            return 7;
        case ForecastHorizon.QUARTER:
            return 90;
        case ForecastHorizon.MONTH:
        default:
            return 30;
    }
}

function getAverageIntervalMs(data: TimeSeriesDataPoint[]): number {
    if (data.length < 2) return 24 * 60 * 60 * 1000;

    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const deltas: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i].timestamp - sorted[i - 1].timestamp;
        if (delta > 0) deltas.push(delta);
    }

    if (deltas.length === 0) return 24 * 60 * 60 * 1000;
    return deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
}

function fitLinearRegression(values: number[]): RegressionModel {
    if (values.length < 2) {
        return { slope: 0, intercept: values[0] ?? 0 };
    }

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        const x = i - xMean;
        const y = values[i] - yMean;
        numerator += x * y;
        denominator += x * x;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    return { slope, intercept };
}

function linearPredict(model: RegressionModel, x: number): number {
    return model.slope * x + model.intercept;
}

function movingAverage(values: number[], windowSize = 5): number {
    if (values.length === 0) return 0;
    const effectiveWindow = Math.min(windowSize, values.length);
    const window = values.slice(values.length - effectiveWindow);
    return window.reduce((sum, v) => sum + v, 0) / window.length;
}

function movingAverageInSample(values: number[], index: number, windowSize = 5): number {
    if (index <= 0) return values[0] ?? 0;
    const start = Math.max(0, index - windowSize);
    const window = values.slice(start, index);
    if (window.length === 0) return values[index] ?? 0;
    return window.reduce((sum, v) => sum + v, 0) / window.length;
}

function inferConfidenceTier(confidence: number): "high" | "medium" | "low" {
    if (confidence >= 0.75) return "high";
    if (confidence >= 0.5) return "medium";
    return "low";
}

function buildForecastPoints(
    historical: TimeSeriesDataPoint[],
    model: ForecastModel,
    horizon: ForecastHorizon,
    metric: MetricForecast["metric"]
): {
    points: ForecastPoint[];
    confidence: number;
    rmse: number;
    volatilityScore: number;
} {
    const sorted = [...historical].sort((a, b) => a.timestamp - b.timestamp);
    const values = sorted.map((p) => p.value);
    const n = values.length;
    const intervalMs = getAverageIntervalMs(sorted);
    const horizonDays = getHorizonDays(horizon);

    const lastTimestamp = sorted[n - 1]?.timestamp ?? Date.now();
    const steps = Math.max(1, Math.round((horizonDays * 24 * 60 * 60 * 1000) / intervalMs));

    const regression = fitLinearRegression(values);
    const trailingAverage = movingAverage(values);

    const inSampleResiduals: number[] = [];
    for (let i = 0; i < n; i++) {
        const lin = linearPredict(regression, i);
        const ma = movingAverageInSample(values, i);

        const fitted =
            model === ForecastModel.LINEAR_TREND
                ? lin
                : model === ForecastModel.MOVING_AVERAGE
                    ? ma
                    : (lin + ma) / 2;

        inSampleResiduals.push(values[i] - fitted);
    }

    const rmse = Math.sqrt(
        inSampleResiduals.reduce((sum, r) => sum + r * r, 0) / Math.max(1, inSampleResiduals.length)
    );
    const meanAbs = Math.max(1e-6, Math.abs(values.reduce((sum, v) => sum + v, 0) / Math.max(1, n)));
    const normalizedRmse = rmse / meanAbs;
    const volatilityScore = clamp(stdDev(values) / meanAbs, 0, 1);

    const confidence = clamp(1 - normalizedRmse * 0.6 - volatilityScore * 0.4, 0.05, 0.98);

    const points: ForecastPoint[] = [];
    const nonNegativeMetric = metric !== "net_flow";

    for (let step = 1; step <= steps; step++) {
        const x = n - 1 + step;
        const linPred = linearPredict(regression, x);
        const maPred = trailingAverage;

        const predictedRaw =
            model === ForecastModel.LINEAR_TREND
                ? linPred
                : model === ForecastModel.MOVING_AVERAGE
                    ? maPred
                    : (linPred + maPred) / 2;

        const uncertainty = rmse * (1 + step / Math.max(2, steps));
        const predicted = nonNegativeMetric ? Math.max(0, predictedRaw) : predictedRaw;
        const lowerBoundRaw = predicted - uncertainty;
        const upperBoundRaw = predicted + uncertainty;

        points.push({
            timestamp: lastTimestamp + intervalMs * step,
            date: new Date(lastTimestamp + intervalMs * step).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            value: predicted,
            predicted,
            lowerBound: nonNegativeMetric ? Math.max(0, lowerBoundRaw) : lowerBoundRaw,
            upperBound: nonNegativeMetric ? Math.max(0, upperBoundRaw) : upperBoundRaw,
            confidence,
        });
    }

    return {
        points,
        confidence,
        rmse,
        volatilityScore,
    };
}

function createInsufficientDataForecast(
    metric: MetricForecast["metric"],
    historical: TimeSeriesDataPoint[],
    horizon: ForecastHorizon,
    model: ForecastModel
): MetricForecast {
    return {
        metric,
        horizon,
        historical,
        forecast: [],
        confidence: 0,
        confidenceTier: "low",
        metadata: {
            dataPointsUsed: historical.length,
            volatilityScore: 1,
            rmse: 0,
            model,
            assumptions: [
                "Insufficient historical data for robust forecasting.",
                `Minimum required points: ${MIN_FORECAST_POINTS}`,
            ],
        },
    };
}

export function generateMetricForecast(
    metric: MetricForecast["metric"],
    historicalInput: TimeSeriesDataPoint[],
    options: {
        horizon?: ForecastHorizon;
        model?: ForecastModel;
        maxHistoryPoints?: number;
    } = {}
): MetricForecast {
    const horizon = options.horizon ?? ForecastHorizon.MONTH;
    const model = options.model ?? ForecastModel.ENSEMBLE;
    const maxHistoryPoints = options.maxHistoryPoints ?? 60;

    const historical = [...historicalInput]
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-maxHistoryPoints);

    if (historical.length < MIN_FORECAST_POINTS) {
        return createInsufficientDataForecast(metric, historical, horizon, model);
    }

    const { points, confidence, rmse, volatilityScore } = buildForecastPoints(
        historical,
        model,
        horizon,
        metric
    );

    return {
        metric,
        horizon,
        historical,
        forecast: points,
        confidence,
        confidenceTier: inferConfidenceTier(confidence),
        metadata: {
            dataPointsUsed: historical.length,
            volatilityScore,
            rmse,
            model,
            assumptions: [
                "Forecasts are generated from historical protocol metrics only.",
                "No external market factors or off-chain signals are included.",
                "Confidence intervals widen over time to reflect uncertainty growth.",
            ],
        },
    };
}

export function generateAnalyticsForecasts(input: {
    balanceHistory: TimeSeriesDataPoint[];
    rewardHistory: TimeSeriesDataPoint[];
    apyHistory: TimeSeriesDataPoint[];
    flowHistory: TimeSeriesDataPoint[];
    horizon?: ForecastHorizon;
    model?: ForecastModel;
}): AnalyticsForecasts {
    const horizon = input.horizon ?? ForecastHorizon.MONTH;
    const model = input.model ?? ForecastModel.ENSEMBLE;

    return {
        performance: generateMetricForecast("balance", input.balanceHistory, { horizon, model }),
        rewards: generateMetricForecast("rewards", input.rewardHistory, { horizon, model }),
        apy: generateMetricForecast("apy", input.apyHistory, { horizon, model }),
        flow: generateMetricForecast("net_flow", input.flowHistory, { horizon, model }),
    };
}
