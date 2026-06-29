import type { ExperimentConfig } from "@/experiments/types";

export const experiments: ExperimentConfig[] = [
  {
    key: "dashboard-command-center",
    description: "New dashboard command center layout for authenticated maintainers.",
    status: "draft",
    defaultVariant: "control",
    audience: {
      percentage: 0,
      roles: ["maintainer", "admin"],
    },
    variants: [
      { key: "control", weight: 1, description: "Existing dashboard experience." },
      { key: "command-center", weight: 0, description: "Experimental command center layout." },
    ],
  },
];

export const experimentConfigByKey = experiments.reduce<Record<string, ExperimentConfig>>((acc, experiment) => {
  acc[experiment.key] = experiment;
  return acc;
}, {});
