import {
    generateMetricForecast,
    generateAnalyticsForecasts,
} from "@/services/analytics/forecasting";
import { ForecastHorizon, ForecastModel, type TimeSeriesDataPoint } from "@/types/analytics";

function buildSeries(values: number[], startTs = 1700000000000): TimeSeriesDataPoint[] {
    return values.map((value, index) => {
        const ts = startTs + index * 24 * 60 * 60 * 1000;
        return {
            timestamp: ts,
            date: new Date(ts).toISOString().slice(0, 10),
            value,
        };
    });
}

describe("forecasting engine", () => {
    it("generates an upward forecast for an upward trend", () => {
        const historical = buildSeries([100, 105, 110, 116, 123, 130, 138, 147, 157, 168, 180, 193]);

        const result = generateMetricForecast("balance", historical, {
            horizon: ForecastHorizon.WEEK,
            model: ForecastModel.LINEAR_TREND,
        });

        expect(result.forecast.length).toBeGreaterThan(0);

        const firstForecast = result.forecast[0].predicted;
        const lastForecast = result.forecast[result.forecast.length - 1].predicted;

        expect(lastForecast).toBeGreaterThanOrEqual(firstForecast);
        expect(result.confidence).toBeGreaterThan(0);
    });

    it("returns low-confidence empty forecast for sparse data", () => {
        const sparse = buildSeries([10, 12, 13, 12, 14, 13, 12]);

        const result = generateMetricForecast("rewards", sparse, {
            horizon: ForecastHorizon.MONTH,
            model: ForecastModel.ENSEMBLE,
        });

        expect(result.forecast).toHaveLength(0);
        expect(result.confidenceTier).toBe("low");
    });

    it("keeps confidence intervals around predicted values", () => {
        const historical = buildSeries([50, 51, 50.5, 52, 51.4, 52.6, 53, 52.8, 53.4, 53.8, 54.1, 54.7]);

        const result = generateMetricForecast("apy", historical, {
            horizon: ForecastHorizon.MONTH,
            model: ForecastModel.ENSEMBLE,
        });

        expect(result.forecast.length).toBeGreaterThan(0);

        for (const point of result.forecast) {
            expect(point.lowerBound).toBeLessThanOrEqual(point.predicted);
            expect(point.upperBound).toBeGreaterThanOrEqual(point.predicted);
        }
    });

    it("assigns lower confidence for higher-volatility history", () => {
        const smooth = buildSeries([100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122]);
        const noisy = buildSeries([100, 140, 80, 145, 75, 155, 90, 160, 85, 150, 95, 165]);

        const smoothForecast = generateMetricForecast("balance", smooth, {
            horizon: ForecastHorizon.MONTH,
            model: ForecastModel.ENSEMBLE,
        });
        const noisyForecast = generateMetricForecast("balance", noisy, {
            horizon: ForecastHorizon.MONTH,
            model: ForecastModel.ENSEMBLE,
        });

        expect(smoothForecast.confidence).toBeGreaterThan(noisyForecast.confidence);
    });

    it("builds all forecast groups from analytics histories", () => {
        const base = buildSeries([100, 101, 102, 103, 105, 106, 108, 109, 111, 113, 114, 116]);

        const forecasts = generateAnalyticsForecasts({
            balanceHistory: base,
            rewardHistory: base.map((p) => ({ ...p, value: p.value / 10 })),
            apyHistory: base.map((p) => ({ ...p, value: p.value / 20 })),
            flowHistory: base.map((p, idx) => ({ ...p, value: idx % 2 === 0 ? 4 : -2 })),
            horizon: ForecastHorizon.WEEK,
            model: ForecastModel.ENSEMBLE,
        });

        expect(forecasts.performance.metric).toBe("balance");
        expect(forecasts.rewards.metric).toBe("rewards");
        expect(forecasts.apy.metric).toBe("apy");
        expect(forecasts.flow.metric).toBe("net_flow");
    });
});
