import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { activityStore } from '@/store/activityStore';
import {
  getEventSubscriptionService,
  type EventSubscriptionService,
} from '@/services/events';

export interface UseActivityFeedOptions {
  /** Start streaming on mount (default true). */
  enabled?: boolean;
  /** Inject a service instance (tests / storybook). Defaults to the singleton. */
  service?: EventSubscriptionService;
}

// Module-level bridge + refcount so the shared service is connected to the
// shared store exactly once, regardless of how many components use the hook,
// and is stopped only when the last consumer unmounts.
let consumers = 0;
let unbind: (() => void) | null = null;

function startBridge(service: EventSubscriptionService): void {
  if (unbind) return;
  const offEvent = service.onEvent((event) => activityStore.addEvent(event));
  const offStatus = service.onStatusChange((status) => activityStore.setStatus(status));
  service.start();
  unbind = () => {
    offEvent();
    offStatus();
    service.stop();
  };
}

function stopBridge(): void {
  unbind?.();
  unbind = null;
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
    consumers += 1;
    startBridge(svc);

    return () => {
      consumers -= 1;
      if (consumers <= 0) {
        consumers = 0;
        stopBridge();
      }
    };
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
