import { evaluateExperiment, EXPERIMENT_STORAGE_KEY, persistExperimentAssignment, setExperimentAnalyticsSink, trackExperimentEvent } from "@/experiments";
import type { ExperimentConfig } from "@/experiments";

const activeExperiment: ExperimentConfig = {
  key: "new-panel",
  description: "New panel",
  status: "active",
  defaultVariant: "control",
  audience: { percentage: 100 },
  variants: [
    { key: "control", weight: 0 },
    { key: "treatment", weight: 1 },
  ],
};

describe("experiment framework", () => {
  afterEach(() => {
    window.localStorage.clear();
    setExperimentAnalyticsSink(undefined);
  });

  it("assigns targeted subjects to weighted variants", () => {
    expect(evaluateExperiment(activeExperiment, { id: "user-1" })).toMatchObject({
      experimentKey: "new-panel",
      variant: "treatment",
      enabled: true,
      reason: "assigned",
    });
  });

  it("returns the default variant for inactive experiments", () => {
    expect(evaluateExperiment({ ...activeExperiment, status: "paused" }, { id: "user-1" })).toMatchObject({
      variant: "control",
      enabled: false,
      reason: "inactive",
    });
  });

  it("honors rollout targeting", () => {
    expect(evaluateExperiment({ ...activeExperiment, audience: { percentage: 0 } }, { id: "user-1" })).toMatchObject({
      variant: "control",
      enabled: false,
      reason: "not_targeted",
    });
  });

  it("persists experiment state in local storage", () => {
    const assignment = evaluateExperiment(activeExperiment, { id: "user-1" });
    persistExperimentAssignment(assignment);

    expect(JSON.parse(window.localStorage.getItem(EXPERIMENT_STORAGE_KEY) ?? "{}")).toEqual({
      "new-panel": assignment,
    });
  });

  it("emits analytics events through the configured sink", () => {
    const events: unknown[] = [];
    setExperimentAnalyticsSink((event) => events.push(event));

    trackExperimentEvent({
      type: "experiment_conversion",
      experimentKey: "new-panel",
      variant: "treatment",
      subjectId: "user-1",
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ experimentKey: "new-panel", variant: "treatment" });
  });
});
