import type {
  EventListener,
  EventSubscriptionService,
  StatusListener,
} from './types';

export interface EventStreamHandlers {
  onEvent: EventListener;
  onStatusChange?: StatusListener;
}

/**
 * Reference-counted lifecycle for the shared {@link EventSubscriptionService}.
 * Multiple hooks (activity feed, notification bridge) can subscribe without
 * one unmount stopping the stream for everyone else.
 */
export function subscribeSharedEventStream(
  service: EventSubscriptionService,
  handlers: EventStreamHandlers,
): () => void {
  const release = acquireSharedStream(service);
  const offEvent = service.onEvent(handlers.onEvent);
  const offStatus = handlers.onStatusChange
    ? service.onStatusChange(handlers.onStatusChange)
    : null;

  return () => {
    offEvent();
    offStatus?.();
    release();
  };
}

let streamConsumers = 0;
let activeService: EventSubscriptionService | null = null;

function acquireSharedStream(service: EventSubscriptionService): () => void {
  streamConsumers += 1;
  if (streamConsumers === 1) {
    activeService = service;
    service.start();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    streamConsumers -= 1;
    if (streamConsumers <= 0) {
      streamConsumers = 0;
      activeService?.stop();
      activeService = null;
    }
  };
}

/** Test helper — reset module-level refcount state. */
export function resetSharedEventStreamForTests(): void {
  streamConsumers = 0;
  activeService = null;
}
