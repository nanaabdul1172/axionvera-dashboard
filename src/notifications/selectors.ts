import type { AppNotification, NotificationFilter } from './types';
import { applyNotificationFilter } from './filtering';
import { sortByPriority } from './prioritization';

/** Unread, non-dismissed count derived from raw store items. */
export function selectUnreadCount(items: AppNotification[]): number {
  return items.filter((n) => !n.read && !n.dismissed).length;
}

/** Filtered + priority-sorted list for the notification panel. */
export function selectVisibleNotifications(
  items: AppNotification[],
  filter: NotificationFilter,
): AppNotification[] {
  return sortByPriority(applyNotificationFilter(items, filter));
}
