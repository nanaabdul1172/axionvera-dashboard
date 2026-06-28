import {
  resetSharedEventStreamForTests,
  subscribeSharedEventStream,
} from '@/services/events/sharedStreamLifecycle';
import type { EventSubscriptionService } from '@/services/events';

function createMockService(): EventSubscriptionService & {
  start: jest.Mock;
  stop: jest.Mock;
  onEvent: jest.Mock;
  onStatusChange: jest.Mock;
} {
  const eventHandlers = new Set<(event: unknown) => void>();
  const statusHandlers = new Set<(status: unknown) => void>();

  return {
    start: jest.fn(),
    stop: jest.fn(),
    onEvent: jest.fn((handler) => {
      eventHandlers.add(handler);
      return () => eventHandlers.delete(handler);
    }),
    onStatusChange: jest.fn((handler) => {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    }),
  } as unknown as EventSubscriptionService & {
    start: jest.Mock;
    stop: jest.Mock;
    onEvent: jest.Mock;
    onStatusChange: jest.Mock;
  };
}

describe('subscribeSharedEventStream', () => {
  beforeEach(() => {
    resetSharedEventStreamForTests();
  });

  it('starts the service on first subscriber and stops after last release', () => {
    const service = createMockService();
    const releaseA = subscribeSharedEventStream(service, {
      onEvent: jest.fn(),
    });
    expect(service.start).toHaveBeenCalledTimes(1);

    const releaseB = subscribeSharedEventStream(service, {
      onEvent: jest.fn(),
    });
    expect(service.start).toHaveBeenCalledTimes(1);

    releaseA();
    expect(service.stop).not.toHaveBeenCalled();

    releaseB();
    expect(service.stop).toHaveBeenCalledTimes(1);
  });
});
