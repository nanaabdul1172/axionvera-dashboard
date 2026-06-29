/**
 * @module widgets/types
 *
 * Shared type definitions for the widget system.
 */

import { DataSource as CoreDataSource, Widget as CoreWidget } from "@/core/dependency/DependencyManager";

export type { DataSource, Widget } from "@/core/dependency/DependencyManager";

export interface WidgetMetadata {
  description?: string;
  author?: string;
  version?: string;
}

export interface DashboardWidget extends CoreWidget {
  component: React.ComponentType<any>;
  metadata?: WidgetMetadata;
}
