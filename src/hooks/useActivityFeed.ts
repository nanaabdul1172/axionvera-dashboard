import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { activityStore } from '@/store/activityStore';
import {
  getEventSubscriptionService,
  type EventSubscriptionService,
} from '@/services/events';
import { subscribeSharedEventStream } from '@/services/events/sharedStreamLifecycle';

export interface UseActivityFeedOptions {
  /** Start streaming on mount (default true). */
  enabled?: boolean;
  /** Inject a service instance (tests / storybook). Defaults to the singleton. */
  service?: EventSubscriptionService;
}

/**
 * Subscribes the dashboard to the real-time protocol event stream and exposes
 * the deduplicated activity feed plus connection status. Reads state via
 * `useSyncExternalStore` so any consumer re-renders when new events arrive.
 */
export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { enabled = true, service } = options;

  const snapshot = useSyncExternalStore(
    activityStore.subscribe,
    activityStore.getSnapshot,
    activityStore.getSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;
    const svc = service ?? getEventSubscriptionService();
    return subscribeSharedEventStream(svc, {
      onEvent: (event) => activityStore.addEvent(event),
      onStatusChange: (status) => activityStore.setStatus(status),
    });
  }, [enabled, service]);

  const clear = useCallback(() => activityStore.clear(), []);

  return {
    events: snapshot.events,
    status: snapshot.status,
    isConnected: snapshot.status === 'connected',
    lastUpdated: snapshot.lastUpdated,
    clear,
  };
}
