import type { DashboardFieldSchema } from "@/types/dashboardSchema";

export function validateFieldValue(field: DashboardFieldSchema, value: string): string | null {
  const rules = field.validation;
  if (!rules) return null;
  if (rules.required && value.trim().length === 0) return rules.message ?? `${field.label} is required.`;
  if (rules.min !== undefined && Number(value) < rules.min) return rules.message ?? `${field.label} must be at least ${rules.min}.`;
  if (rules.max !== undefined && Number(value) > rules.max) return rules.message ?? `${field.label} must be at most ${rules.max}.`;
  if (rules.pattern && !new RegExp(rules.pattern).test(value)) return rules.message ?? `${field.label} is invalid.`;
  return null;
}
