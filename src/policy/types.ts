export enum PolicyEvaluationResult {
  ALLOW = 'allow',
  DENY = 'deny',
  WARN = 'warn'
}

export interface PolicyContext {
  timestamp: number;
  actor: string;
  operation: string;
  metadata?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

export interface PolicyViolation {
  policyId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PolicyEvaluationResponse {
  result: PolicyEvaluationResult;
  violations: PolicyViolation[];
  evaluatedAt: number;
  policyCount: number;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  version: string;
  enabled: boolean;
  evaluate(context: PolicyContext): Promise<PolicyEvaluationResponse>;
}

export interface PolicyEvaluator {
  evaluate(policy: Policy, context: PolicyContext): Promise<PolicyEvaluationResponse>;
}

export interface PolicyEvent {
  type: 'policy.evaluated' | 'policy.added' | 'policy.removed' | 'policy.updated';
  timestamp: number;
  data: unknown;
}

export type PolicyEventHandler = (event: PolicyEvent) => void | Promise<void>;
