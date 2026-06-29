import type { ExperimentAnalyticsEvent } from "./types";

export type ExperimentAnalyticsSink = (event: ExperimentAnalyticsEvent) => void;

let analyticsSink: ExperimentAnalyticsSink | undefined;

export function setExperimentAnalyticsSink(sink: ExperimentAnalyticsSink | undefined): void {
  analyticsSink = sink;
}

export function trackExperimentEvent(event: Omit<ExperimentAnalyticsEvent, "timestamp">): void {
  const payload = { ...event, timestamp: Date.now() };
  if (analyticsSink) {
    analyticsSink(payload);
    return;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("axionvera:experiment", { detail: payload }));
  }
}
