import { applyNotificationFilter } from '@/notifications/filtering';
import {
  filterFreshNotifications,
  normalizeNotificationInput,
  syncDedupeSets,
  trackNotificationIds,
} from '@/notifications/normalize';
import {
  loadNotificationState,
  saveNotificationState,
} from '@/notifications/persistence';
import { sortByPriority } from '@/notifications/prioritization';
import {
  selectUnreadCount,
  selectVisibleNotifications,
} from '@/notifications/selectors';
import type {
  AppNotification,
  NotificationFilter,
  NotificationInput,
  NotificationState,
} from '@/notifications/types';
import {
  DEFAULT_NOTIFICATION_FILTER,
  NOTIFICATION_STORAGE_VERSION,
} from '@/notifications/types';

const DEFAULT_MAX_ITEMS = 100;

/**
 * Framework-agnostic observable store for the notification center (#268).
 *
 * Consumed via `useSyncExternalStore` in {@link useNotifications}. Persists
 * read/unread and dismissal state to localStorage. Ingestion is idempotent:
 * duplicates (by id or sourceId) are ignored.
 */
export class NotificationStore {
  private state: NotificationState = {
    items: [],
    filter: DEFAULT_NOTIFICATION_FILTER,
    lastUpdated: null,
  };

  private readonly listeners = new Set<() => void>();
  private readonly seenIds = new Set<string>();
  private readonly seenSourceIds = new Set<string>();
  private readonly maxItems: number;
  private hydrated = false;

  constructor(maxItems: number = DEFAULT_MAX_ITEMS) {
    this.maxItems = maxItems;
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): NotificationState {
    return this.state;
  }

  /** Load persisted state from localStorage (browser only, once). */
  hydrate(): void {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;

    const persisted = loadNotificationState();
    if (!persisted) return;

    trackNotificationIds(persisted.items, this.seenIds, this.seenSourceIds);

    this.state = {
      items: sortByPriority(persisted.items),
      filter: persisted.filter,
      lastUpdated: Date.now(),
    };
  }

  /** Visible notifications matching the active filter, priority-sorted. */
  getVisibleNotifications(): AppNotification[] {
    return selectVisibleNotifications(this.state.items, this.state.filter);
  }

  getUnreadCount(): number {
    return selectUnreadCount(this.state.items);
  }

  addNotification(input: NotificationInput): void {
    this.addNotifications([input]);
  }

  addNotifications(incoming: NotificationInput[]): void {
    const fresh = filterFreshNotifications(
      incoming,
      this.seenIds,
      this.seenSourceIds,
    );
    if (fresh.length === 0) return;

    const normalized = fresh.map(normalizeNotificationInput);
    trackNotificationIds(normalized, this.seenIds, this.seenSourceIds);

    const merged = sortByPriority([...normalized, ...this.state.items]).slice(
      0,
      this.maxItems,
    );

    syncDedupeSets(merged, this.seenIds, this.seenSourceIds);
    this.commit({ items: merged });
  }

  markAsRead(id: string): void {
    this.updateItem(id, (item) => ({ ...item, read: true }));
  }

  markAllAsRead(): void {
    if (!this.state.items.some((n) => !n.read && !n.dismissed)) return;

    this.commit({
      items: this.state.items.map((n) =>
        n.dismissed ? n : { ...n, read: true },
      ),
    });
  }

  dismiss(id: string): void {
    this.updateItem(id, (item) => ({ ...item, dismissed: true, read: true }));
  }

  dismissAllVisible(): void {
    const visibleIds = new Set(
      applyNotificationFilter(this.state.items, this.state.filter).map((n) => n.id),
    );
    if (visibleIds.size === 0) return;

    this.commit({
      items: this.state.items.map((n) =>
        visibleIds.has(n.id) ? { ...n, dismissed: true, read: true } : n,
      ),
    });
  }

  setFilter(filter: Partial<NotificationFilter>): void {
    this.commit({
      filter: { ...this.state.filter, ...filter },
    });
  }

  clearDismissed(): void {
    const remaining = this.state.items.filter((n) => !n.dismissed);
    if (remaining.length === this.state.items.length) return;

    syncDedupeSets(remaining, this.seenIds, this.seenSourceIds);
    this.commit({ items: remaining });
  }

  /** Test helper — reset in-memory state. */
  reset(): void {
    this.seenIds.clear();
    this.seenSourceIds.clear();
    this.hydrated = false;
    this.state = {
      items: [],
      filter: DEFAULT_NOTIFICATION_FILTER,
      lastUpdated: null,
    };
    this.emit();
  }

  private updateItem(
    id: string,
    updater: (item: AppNotification) => AppNotification,
  ): void {
    const index = this.state.items.findIndex((n) => n.id === id);
    if (index === -1) return;

    const items = [...this.state.items];
    items[index] = updater(items[index]);
    this.commit({ items });
  }

  private commit(partial: Partial<Pick<NotificationState, 'items' | 'filter'>>): void {
    this.state = {
      ...this.state,
      ...partial,
      lastUpdated: Date.now(),
    };
    this.persist();
    this.emit();
  }

  private persist(): void {
    saveNotificationState({
      version: NOTIFICATION_STORAGE_VERSION,
      items: this.state.items,
      filter: this.state.filter,
    });
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb());
  }
}

/** Shared store instance used across the dashboard. */
export const notificationStore = new NotificationStore();

/** Imperative API for pushing notifications from hooks, contexts, or adapters. */
export function pushNotification(input: NotificationInput): void {
  notificationStore.hydrate();
  notificationStore.addNotification(input);
}

export function pushNotifications(inputs: NotificationInput[]): void {
  notificationStore.hydrate();
  notificationStore.addNotifications(inputs);
}
