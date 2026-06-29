import type { ExperimentAssignment } from "./types";

const STORAGE_KEY = "axionvera:experiments:v1";

export function readExperimentAssignments(): Record<string, ExperimentAssignment> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ExperimentAssignment>;
  } catch {
    return {};
  }
}

export function persistExperimentAssignment(assignment: ExperimentAssignment): void {
  if (typeof window === "undefined") return;
  const assignments = readExperimentAssignments();
  assignments[assignment.experimentKey] = assignment;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

export { STORAGE_KEY as EXPERIMENT_STORAGE_KEY };
