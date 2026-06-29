import type { DashboardExtension, ExtensionContributionBase, ExtensionManifest } from "./types";

const idPattern = /^[a-z0-9][a-z0-9.-]{1,62}[a-z0-9]$/;

export function validateManifest(manifest: unknown): manifest is ExtensionManifest {
  if (!manifest || typeof manifest !== "object") return false;
  const candidate = manifest as Partial<ExtensionManifest>;
  return Boolean(
    typeof candidate.id === "string" &&
      idPattern.test(candidate.id) &&
      typeof candidate.name === "string" &&
      candidate.name.trim().length > 0 &&
      typeof candidate.version === "string" &&
      candidate.version.trim().length > 0,
  );
}

export function validateContribution(contribution: unknown): contribution is ExtensionContributionBase {
  if (!contribution || typeof contribution !== "object") return false;
  const candidate = contribution as Partial<ExtensionContributionBase>;
  return Boolean(
    typeof candidate.id === "string" &&
      idPattern.test(candidate.id) &&
      ["module", "widget", "panel", "integration"].includes(String(candidate.type)) &&
      typeof candidate.title === "string" &&
      candidate.title.trim().length > 0,
  );
}

export function validateExtension(extension: unknown): extension is DashboardExtension {
  if (!extension || typeof extension !== "object") return false;
  const candidate = extension as Partial<DashboardExtension>;
  return validateManifest(candidate.manifest) && typeof candidate.activate === "function";
}
