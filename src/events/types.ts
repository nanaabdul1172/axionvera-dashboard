/**
 * Dashboard event lifecycle:
 * 1. A module publishes a typed event with `eventBus.publish(type, payload)`.
 * 2. The bus creates an immutable envelope containing metadata, depth, and a path.
 * 3. Matching subscribers run in priority order (higher priority first), then by subscription order.
 * 4. Each subscriber can return a cleanup function from `subscribe`; callers must invoke it on unmount/dispose.
 * 5. Nested publishes are allowed until loop protection detects a repeated event path or depth limit.
 */
export interface DashboardEventMap {
  "dashboard:ready": { source: string };
  "widget:mounted": { widgetId: string; widgetType?: string };
  "widget:unmounted": { widgetId: string };
  "widget:refresh": { widgetId: string; reason?: string };
  "service:status": { service: string; status: "idle" | "loading" | "ready" | "error"; message?: string };
  "plugin:registered": { pluginId: string; capabilities?: string[] };
  "plugin:unregistered": { pluginId: string };
  "notification:created": { id: string; level: "info" | "success" | "warning" | "error"; message: string };
}

export type EventType = keyof DashboardEventMap & string;
export type EventPayload<TEvents extends object, TType extends keyof TEvents & string> = TEvents[TType];

export interface EventEnvelope<TType extends string = string, TPayload = unknown> {
  id: string;
  type: TType;
  payload: TPayload;
  timestamp: number;
  source?: string;
  correlationId?: string;
  depth: number;
  path: string[];
}

export interface PublishOptions {
  source?: string;
  correlationId?: string;
}

export interface SubscribeOptions {
  /** Higher values run earlier. Defaults to 0. */
  priority?: number;
  /** Optional label used in diagnostics and event paths. */
  subscriberId?: string;
}

export type EventHandler<TPayload, TType extends string = string> = (
  event: EventEnvelope<TType, TPayload>,
) => void | Promise<void>;

export type Unsubscribe = () => void;

export interface EventBusOptions {
  maxPublishDepth?: number;
  idFactory?: () => string;
  now?: () => number;
  onLoopPrevented?: (event: EventEnvelope, reason: string) => void;
}

export class EventLoopPreventedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventLoopPreventedError";
  }
}
