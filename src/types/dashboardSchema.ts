export type DashboardFieldType = "text" | "number" | "email" | "password";

export interface DashboardValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface DashboardFieldSchema {
  id: string;
  label: string;
  type?: DashboardFieldType;
  placeholder?: string;
  helperText?: string;
  validation?: DashboardValidationRule;
}

export interface DashboardColumnSchema {
  key: string;
  header: string;
}

export interface DashboardWidgetSchema {
  id: string;
  type: "metric" | "text";
  title: string;
  value?: string | number;
  description?: string;
}

export interface DashboardBaseNode {
  id: string;
  title?: string;
  description?: string;
  className?: string;
}

export interface DashboardLayoutNode extends DashboardBaseNode {
  component: "layout";
  variant?: "stack" | "grid" | "section";
  columns?: 1 | 2 | 3 | 4;
  children: DashboardSchemaNode[];
}

export interface DashboardFormNode extends DashboardBaseNode {
  component: "form";
  submitLabel?: string;
  fields: DashboardFieldSchema[];
}

export interface DashboardTableNode extends DashboardBaseNode {
  component: "table";
  columns: DashboardColumnSchema[];
  rows: Record<string, string | number | boolean | null>[];
  emptyMessage?: string;
}

export interface DashboardWidgetNode extends DashboardBaseNode {
  component: "widget";
  widgets: DashboardWidgetSchema[];
}

export type DashboardSchemaNode =
  | DashboardLayoutNode
  | DashboardFormNode
  | DashboardTableNode
  | DashboardWidgetNode;

export interface DashboardPageSchema {
  version: 1;
  id: string;
  title: string;
  description?: string;
  root: DashboardSchemaNode;
}

export interface ParsedDashboardSchema {
  schema: DashboardPageSchema;
  warnings: string[];
}
