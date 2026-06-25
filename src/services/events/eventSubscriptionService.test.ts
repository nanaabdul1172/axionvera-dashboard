import { EventSubscriptionService } from './eventSubscriptionService';
import type { ActivityEvent, EventFetcher, RawSorobanEvent } from './types';

function makeRaw(id: string, name = 'deposit', ledger = 100): RawSorobanEvent {
  return {
    id,
    topic: [name],
    contractId: 'CVAULT',
    ledger,
    ledgerClosedAt: '2026-01-01T00:00:00Z',
    value: '1',
  };
}

function makeService(
  fetcher: EventFetcher,
  overrides: Partial<ConstructorParameters<typeof EventSubscriptionService>[0]> = {},
) {
  const service = new EventSubscriptionService({
    contractIds: ['CVAULT'],
    fetcher,
    pollIntervalMs: 5000,
    baseReconnectDelayMs: 1000,
    maxReconnectDelayMs: 30000,
    maxReconnectAttempts: 3,
    ...overrides,
  });
  const events: ActivityEvent[] = [];
  const statuses: string[] = [];
  service.onEvent((e) => events.push(e));
  service.onStatusChange((s) => statuses.push(s));
  return { service, events, statuses };
}

describe('EventSubscriptionService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('connects and emits events from the latest ledger', async () => {
    const fetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(100),
      getEvents: jest.fn().mockResolvedValue({ events: [makeRaw('e1')], latestLedger: 100 }),
    };
    const { service, events, statuses } = makeService(fetcher);

    service.start();
    await jest.advanceTimersByTimeAsync(0);

    expect(statuses).toContain('connecting');
    expect(statuses).toContain('connected');
    expect(events.map((e) => e.id)).toEqual(['e1']);
    expect(service.getStatus()).toBe('connected');

    service.stop();
  });

  it('deduplicates events redelivered across polls', async () => {
    const fetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(100),
      getEvents: jest
        .fn()
        // Same id 'e1' returned twice; 'e2' is new on the second poll.
        .mockResolvedValueOnce({ events: [makeRaw('e1')], latestLedger: 100 })
        .mockResolvedValueOnce({ events: [makeRaw('e1'), makeRaw('e2')], latestLedger: 101 }),
    };
    const { service, events } = makeService(fetcher);

    service.start();
    await jest.advanceTimersByTimeAsync(0); // first poll
    await jest.advanceTimersByTimeAsync(5000); // second poll after interval

    expect(events.map((e) => e.id)).toEqual(['e1', 'e2']);

    service.stop();
  });

  it('advances the ledger cursor between polls', async () => {
    const getEvents = jest
      .fn()
      .mockResolvedValueOnce({ events: [], latestLedger: 100 })
      .mockResolvedValueOnce({ events: [], latestLedger: 105 });
    const fetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(100),
      getEvents,
    };
    const { service } = makeService(fetcher);

    service.start();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(5000);

    // First call starts at the latest ledger (100); second resumes at 101.
    expect(getEvents.mock.calls[0][0].startLedger).toBe(100);
    expect(getEvents.mock.calls[1][0].startLedger).toBe(101);

    service.stop();
  });

  it('reconnects with backoff after a transient failure', async () => {
    const getEvents = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue({ events: [makeRaw('e1')], latestLedger: 100 });
    const fetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(100),
      getEvents,
    };
    const { service, events, statuses } = makeService(fetcher);

    service.start();
    await jest.advanceTimersByTimeAsync(0); // first poll fails

    expect(statuses).toContain('reconnecting');
    expect(service.getStatus()).toBe('reconnecting');

    // Backoff = base * 2^0 = 1000ms for the first retry.
    await jest.advanceTimersByTimeAsync(1000);
    expect(events.map((e) => e.id)).toEqual(['e1']);
    expect(service.getStatus()).toBe('connected');

    service.stop();
  });

  it('gives up with error status after exhausting reconnect attempts', async () => {
    const fetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(100),
      getEvents: jest.fn().mockRejectedValue(new Error('always down')),
    };
    const { service, statuses } = makeService(fetcher, { maxReconnectAttempts: 2 });

    service.start();
    await jest.advanceTimersByTimeAsync(0); // attempt 1 -> reconnecting
    await jest.advanceTimersByTimeAsync(1000); // attempt 2 -> reconnecting
    await jest.advanceTimersByTimeAsync(2000); // attempt 3 -> exceeds max -> error

    expect(service.getStatus()).toBe('error');
    expect(statuses[statuses.length - 1]).toBe('error');
  });

  it('stops polling after stop()', async () => {
    const getEvents = jest
      .fn()
      .mockResolvedValue({ events: [], latestLedger: 100 });
    const fetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(100),
      getEvents,
    };
    const { service } = makeService(fetcher);

    service.start();
    await jest.advanceTimersByTimeAsync(0);
    const callsAfterFirst = getEvents.mock.calls.length;

    service.stop();
    await jest.advanceTimersByTimeAsync(20000);

    expect(getEvents.mock.calls.length).toBe(callsAfterFirst);
    expect(service.getStatus()).toBe('disconnected');
  });
});
