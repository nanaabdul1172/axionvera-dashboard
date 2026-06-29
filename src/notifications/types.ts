/**
 * Notification categories surfaced in the notification center (#268).
 */
export type NotificationCategory =
  | 'protocol'
  | 'transaction'
  | 'governance'
  | 'reward';

/** Higher values sort first when timestamps are equal. */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * UI-ready notification record persisted in the dashboard store.
 */
export interface AppNotification {
  /** Stable unique id (deduplication + React keys). */
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  /** Optional upstream id (e.g. activity event id) for idempotent ingestion. */
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationFilterCategory = 'all' | NotificationCategory;

export type NotificationFilterRead = 'all' | 'unread' | 'read';

export interface NotificationFilter {
  category: NotificationFilterCategory;
  read: NotificationFilterRead;
}

export interface NotificationState {
  items: AppNotification[];
  filter: NotificationFilter;
  lastUpdated: number | null;
}

/** Payload accepted by {@link pushNotification} — read/dismissed default at ingest. */
export type NotificationInput = Omit<AppNotification, 'read' | 'dismissed'> & {
  read?: boolean;
  dismissed?: boolean;
};

export const DEFAULT_NOTIFICATION_FILTER: NotificationFilter = {
  category: 'all',
  read: 'all',
};

export const NOTIFICATION_STORAGE_VERSION = 1;
