import type { DashboardExtension } from "@/sdk";

export const sampleProtocolExtension: DashboardExtension = {
  manifest: {
    id: "axionvera.sample-protocol",
    name: "Sample Protocol Toolkit",
    version: "0.1.0",
    description: "Demonstrates dashboard modules, widgets, panels, and integrations.",
    author: "Axionvera",
  },
  activate(context) {
    context.registerContribution({
      id: "sample-protocol-health",
      type: "widget",
      title: "Protocol Health Widget",
      description: "Shows how an extension contributes a dashboard widget.",
    });
    context.registerContribution({
      id: "sample-protocol-panel",
      type: "panel",
      title: "Protocol Operations Panel",
      description: "Shows how an extension contributes a dashboard panel.",
    });
  },
  deactivate(context) {
    context.unregisterContribution("sample-protocol-health");
    context.unregisterContribution("sample-protocol-panel");
  },
};
