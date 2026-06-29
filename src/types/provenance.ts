export type TransformationStep = {
  operation: string; // e.g. "formatAmount", "calculateYield"
  timestamp: number;
  actor: string; // The component or function applying the transformation
  previousValue?: any;
};

export type ProvenanceMetadata = {
  source: string; // e.g., "API", "Cache", "Mock"
  createdAt: number;
  lineage: TransformationStep[];
};

export type TrackedValue<T> = {
  value: T;
  __provenance: ProvenanceMetadata;
};

export type MaybeTracked<T> = T | TrackedValue<T>;
