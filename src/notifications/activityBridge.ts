import { notificationFromActivityEvent } from '@/notifications/adapters/fromActivityEvent';
import type { NotificationInput } from '@/notifications/types';
import type { EventSubscriptionService } from '@/services/events';
import { subscribeSharedEventStream } from '@/services/events/sharedStreamLifecycle';
import { notificationStore } from '@/store/notificationStore';

const PROTOCOL_STREAM_ERROR: NotificationInput = {
  id: 'protocol:stream-error',
  category: 'protocol',
  priority: 'high',
  title: 'Event stream interrupted',
  message: 'Could not connect to the protocol event stream. Retrying…',
  timestamp: new Date().toISOString(),
};

/**
 * Subscribes the notification store to live protocol events (#215 → #268).
 * Uses the shared event-stream lifecycle so unmounting the notification
 * panel does not stop the stream for other consumers.
 */
export function subscribeNotificationActivityBridge(
  service: EventSubscriptionService,
): () => void {
  return subscribeSharedEventStream(service, {
    onEvent: (event) => {
      notificationStore.addNotification(notificationFromActivityEvent(event));
    },
    onStatusChange: (status) => {
      if (status === 'error') {
        notificationStore.addNotification({
          ...PROTOCOL_STREAM_ERROR,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
}
