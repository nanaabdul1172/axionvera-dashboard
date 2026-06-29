import type { ExtensionContributionBase } from "@/sdk";

export function selectExtensionWidgets(contributions: ExtensionContributionBase[]): ExtensionContributionBase[] {
  return contributions.filter((contribution) => contribution.type === "widget");
}
