import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { subscribeNotificationActivityBridge } from '@/notifications/activityBridge';
import {
  selectUnreadCount,
  selectVisibleNotifications,
} from '@/notifications/selectors';
import type { NotificationFilter } from '@/notifications/types';
import {
  getEventSubscriptionService,
  type EventSubscriptionService,
} from '@/services/events';
import { notificationStore } from '@/store/notificationStore';

export interface UseNotificationsOptions {
  /** Bridge live protocol events into the notification center (default true). */
  subscribeToActivity?: boolean;
  /** Inject a service instance (tests). Defaults to the singleton. */
  service?: EventSubscriptionService;
}

/**
 * Subscribes to the notification center store and exposes filtered,
 * priority-sorted notifications plus lifecycle actions (#268).
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { subscribeToActivity = true, service } = options;

  useEffect(() => {
    notificationStore.hydrate();
  }, []);

  const snapshot = useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.getSnapshot,
    notificationStore.getSnapshot,
  );

  useEffect(() => {
    if (!subscribeToActivity) return;
    const svc = service ?? getEventSubscriptionService();
    return subscribeNotificationActivityBridge(svc);
  }, [subscribeToActivity, service]);

  const notifications = useMemo(
    () => selectVisibleNotifications(snapshot.items, snapshot.filter),
    [snapshot.items, snapshot.filter],
  );

  const unreadCount = useMemo(
    () => selectUnreadCount(snapshot.items),
    [snapshot.items],
  );

  const markAsRead = useCallback((id: string) => {
    notificationStore.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationStore.markAllAsRead();
  }, []);

  const dismiss = useCallback((id: string) => {
    notificationStore.dismiss(id);
  }, []);

  const dismissAllVisible = useCallback(() => {
    notificationStore.dismissAllVisible();
  }, []);

  const setFilter = useCallback((filter: Partial<NotificationFilter>) => {
    notificationStore.setFilter(filter);
  }, []);

  return {
    notifications,
    unreadCount,
    filter: snapshot.filter,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAllVisible,
    setFilter,
  };
}
