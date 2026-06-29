import type { ExperimentAssignment, ExperimentConfig, ExperimentSubject } from "./types";

export const ANONYMOUS_SUBJECT_ID = "anonymous";

export function getExperimentSubjectId(subject: ExperimentSubject = {}): string {
  return subject.id ?? subject.walletAddress ?? ANONYMOUS_SUBJECT_ID;
}

export function hashToPercentage(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export function isSubjectTargeted(config: ExperimentConfig, subject: ExperimentSubject = {}): boolean {
  const audience = config.audience;
  if (!audience) return true;

  const wallet = subject.walletAddress?.toLowerCase();
  if (audience.walletAddresses?.length) {
    return Boolean(wallet && audience.walletAddresses.some((address) => address.toLowerCase() === wallet));
  }

  if (audience.roles?.length) {
    const roles = new Set(subject.roles ?? []);
    if (!audience.roles.some((role) => roles.has(role))) return false;
  }

  if (typeof audience.percentage === "number") {
    const percentage = Math.max(0, Math.min(100, audience.percentage));
    return hashToPercentage(`${config.key}:${getExperimentSubjectId(subject)}`) < percentage;
  }

  return true;
}

export function chooseVariant(config: ExperimentConfig, subject: ExperimentSubject = {}): string {
  const totalWeight = config.variants.reduce((sum, variant) => sum + Math.max(0, variant.weight), 0);
  if (totalWeight <= 0) return config.defaultVariant;

  const bucket = (hashToPercentage(`${getExperimentSubjectId(subject)}:${config.key}:variant`) / 100) * totalWeight;
  let cumulative = 0;
  for (const variant of config.variants) {
    cumulative += Math.max(0, variant.weight);
    if (bucket < cumulative) return variant.key;
  }
  return config.defaultVariant;
}

export function evaluateExperiment(config: ExperimentConfig | undefined, subject: ExperimentSubject = {}): ExperimentAssignment {
  if (!config || !config.variants.some((variant) => variant.key === config.defaultVariant)) {
    return { experimentKey: config?.key ?? "unknown", variant: config?.defaultVariant ?? "control", enabled: false, reason: "invalid_config" };
  }

  if (config.status !== "active") {
    return { experimentKey: config.key, variant: config.defaultVariant, enabled: false, reason: "inactive" };
  }

  if (!isSubjectTargeted(config, subject)) {
    return { experimentKey: config.key, variant: config.defaultVariant, enabled: false, reason: "not_targeted" };
  }

  const variant = chooseVariant(config, subject);
  return { experimentKey: config.key, variant, enabled: variant !== config.defaultVariant, reason: "assigned" };
}
