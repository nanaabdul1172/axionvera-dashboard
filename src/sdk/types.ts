import type { ComponentType, ReactNode } from "react";

export type ExtensionContributionType = "module" | "widget" | "panel" | "integration";

export interface ExtensionContributionBase {
  id: string;
  type: ExtensionContributionType;
  title: string;
  description?: string;
  component?: ComponentType<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions?: string[];
}

export interface ExtensionContext {
  readonly manifest: ExtensionManifest;
  readonly logger: Pick<Console, "debug" | "info" | "warn" | "error">;
  registerContribution(contribution: ExtensionContributionBase): void;
  unregisterContribution(contributionId: string): void;
}

export interface DashboardExtension {
  manifest: ExtensionManifest;
  activate(context: ExtensionContext): void | Promise<void>;
  deactivate?(context: ExtensionContext): void | Promise<void>;
}

export interface RegisteredExtension {
  manifest: ExtensionManifest;
  status: "active" | "inactive";
  contributions: ExtensionContributionBase[];
}

export type ExtensionFactory = () => DashboardExtension | Promise<DashboardExtension>;
export type ExtensionModule = DashboardExtension | { default: DashboardExtension | ExtensionFactory } | ExtensionFactory;

export interface ExtensionLoadResult {
  extensionId: string;
  status: "loaded" | "rejected";
  reason?: string;
}

export interface ExtensionHostOptions {
  logger?: Pick<Console, "debug" | "info" | "warn" | "error">;
}
