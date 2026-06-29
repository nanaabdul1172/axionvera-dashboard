import { useEffect, useCallback } from 'react';
import {
  getEventSubscriptionService,
  type ConnectionStatus,
  type EventSubscriptionService,
  type ActivityEvent,
} from '@/services/events';
import { subscribeSharedEventStream } from '@/services/events/sharedStreamLifecycle';
import type { ParsedSorobanEvent } from '@/utils/parseEvents';
import { getSorobanEventStream } from '@/utils/sorobanEventStream';

type UseSorobanEventsOptions = {
  contractId?: string | null;
  onEvent?: (event: ParsedSorobanEvent) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  service?: EventSubscriptionService;
};

function toParsedEvent(event: ActivityEvent): ParsedSorobanEvent {
  return {
    id: event.id,
    type: event.name && event.name !== 'unknown' ? event.name : event.type,
    contractId: event.contractId,
    ledger: event.ledger,
    ledgerClosedAt: event.timestamp,
    topics: event.topics,
    value: event.value,
  };
}

function toLegacyStatus(status: ConnectionStatus): 'connecting' | 'connected' | 'disconnected' | 'error' {
  switch (status) {
    case 'connected':
      return 'connected';
    case 'disconnected':
    case 'idle':
      return 'disconnected';
    case 'error':
      return 'error';
    case 'connecting':
    case 'reconnecting':
    default:
      return 'connecting';
  }
}

export function useSorobanEvents(options: UseSorobanEventsOptions = {}) {
  const { contractId, onEvent, onStatusChange, service } = options;

  useEffect(() => {
    if (!onEvent && !onStatusChange) return;

    const svc = service ?? getEventSubscriptionService();
    return subscribeSharedEventStream(svc, {
      onEvent: (event) => {
        if (!onEvent) return;
        if (contractId && event.contractId !== contractId) return;
        onEvent(toParsedEvent(event));
      },
      onStatusChange: onStatusChange
        ? (status) => onStatusChange(toLegacyStatus(status))
        : undefined,
    });
  }, [contractId, onEvent, onStatusChange, service]);

  const simulateEvent = useCallback((rawEvent: any) => {
    const stream = getSorobanEventStream();
    stream.simulateEvent(rawEvent);
  }, []);

  return { simulateEvent };
}
