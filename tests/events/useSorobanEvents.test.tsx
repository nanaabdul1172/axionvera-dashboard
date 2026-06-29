import { act, renderHook } from '@testing-library/react';
import { useSorobanEvents } from '@/hooks/useSorobanEvents';
import type {
  ActivityEvent,
  ConnectionStatus,
  EventSubscriptionService,
} from '@/services/events';

const mockSimulateEvent = jest.fn();

jest.mock('@/utils/sorobanEventStream', () => ({
  getSorobanEventStream: () => ({ simulateEvent: mockSimulateEvent }),
}));

function makeActivityEvent(
  id: string,
  contractId = 'CVAULT',
  type: ActivityEvent['type'] = 'deposit',
): ActivityEvent {
  return {
    id,
    type,
    name: type,
    contractId,
    ledger: 123,
    timestamp: '2026-01-01T00:00:00Z',
    topics: [type],
    value: '1',
  };
}

function createMockService(): EventSubscriptionService & {
  start: jest.Mock;
  stop: jest.Mock;
  onEvent: jest.Mock;
  onStatusChange: jest.Mock;
  emitEvent: (event: ActivityEvent) => void;
  emitStatus: (status: ConnectionStatus) => void;
} {
  const eventHandlers = new Set<(event: ActivityEvent) => void>();
  const statusHandlers = new Set<(status: ConnectionStatus) => void>();

  return {
    start: jest.fn(),
    stop: jest.fn(),
    getStatus: jest.fn(() => 'idle'),
    onEvent: jest.fn((handler: (event: ActivityEvent) => void) => {
      eventHandlers.add(handler);
      return () => eventHandlers.delete(handler);
    }),
    onStatusChange: jest.fn((handler: (status: ConnectionStatus) => void) => {
      statusHandlers.add(handler);
      return () => statusHandlers.delete(handler);
    }),
    emitEvent: (event: ActivityEvent) => {
      eventHandlers.forEach((handler) => handler(event));
    },
    emitStatus: (status: ConnectionStatus) => {
      statusHandlers.forEach((handler) => handler(status));
    },
  } as unknown as EventSubscriptionService & {
    start: jest.Mock;
    stop: jest.Mock;
    onEvent: jest.Mock;
    onStatusChange: jest.Mock;
    emitEvent: (event: ActivityEvent) => void;
    emitStatus: (status: ConnectionStatus) => void;
  };
}

describe('useSorobanEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards matching contract events in ParsedSorobanEvent shape', () => {
    const service = createMockService();
    const onEvent = jest.fn();

    renderHook(() =>
      useSorobanEvents({
        contractId: 'CVAULT',
        onEvent,
        service,
      }),
    );

    act(() => {
      service.emitEvent(makeActivityEvent('e1', 'CVAULT', 'reward'));
      service.emitEvent(makeActivityEvent('e2', 'OTHER', 'deposit'));
    });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'e1',
        type: 'reward',
        contractId: 'CVAULT',
        ledger: 123,
        ledgerClosedAt: '2026-01-01T00:00:00Z',
      }),
    );
  });

  it('maps reconnecting status to connecting for backward compatibility', () => {
    const service = createMockService();
    const onStatusChange = jest.fn();

    renderHook(() =>
      useSorobanEvents({
        onStatusChange,
        service,
      }),
    );

    act(() => {
      service.emitStatus('reconnecting');
      service.emitStatus('connected');
      service.emitStatus('idle');
    });

    expect(onStatusChange.mock.calls.map((c) => c[0])).toEqual([
      'connecting',
      'connected',
      'disconnected',
    ]);
  });

  it('keeps simulateEvent compatibility helper', () => {
    const { result } = renderHook(() => useSorobanEvents());
    const rawEvent = { id: 'raw-1' };

    act(() => {
      result.current.simulateEvent(rawEvent);
    });

    expect(mockSimulateEvent).toHaveBeenCalledWith(rawEvent);
  });
});
