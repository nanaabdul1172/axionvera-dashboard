export type ExperimentStatus = "draft" | "active" | "paused" | "completed";

export type ExperimentVariant = {
  key: string;
  weight: number;
  description?: string;
};

export type ExperimentAudience = {
  walletAddresses?: string[];
  roles?: string[];
  percentage?: number;
};

export type ExperimentConfig = {
  key: string;
  description: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  defaultVariant: string;
  audience?: ExperimentAudience;
};

export type ExperimentSubject = {
  id?: string | null;
  walletAddress?: string | null;
  roles?: string[];
};

export type ExperimentAssignment = {
  experimentKey: string;
  variant: string;
  enabled: boolean;
  reason: "assigned" | "default" | "inactive" | "not_targeted" | "invalid_config";
};

export type ExperimentAnalyticsEvent = {
  type: "experiment_exposure" | "experiment_conversion";
  experimentKey: string;
  variant: string;
  subjectId: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};
