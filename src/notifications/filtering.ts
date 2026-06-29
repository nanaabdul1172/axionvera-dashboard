import type { AppNotification, NotificationFilter } from './types';

/**
 * Returns visible notifications after applying active filters.
 * Dismissed items are always excluded from the center panel.
 */
export function applyNotificationFilter(
  items: AppNotification[],
  filter: NotificationFilter,
): AppNotification[] {
  return items.filter((item) => {
    if (item.dismissed) return false;
    if (filter.category !== 'all' && item.category !== filter.category) return false;
    if (filter.read === 'unread' && item.read) return false;
    if (filter.read === 'read' && !item.read) return false;
    return true;
  });
}
