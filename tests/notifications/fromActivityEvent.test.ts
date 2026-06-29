import { notificationFromActivityEvent } from '@/notifications/adapters/fromActivityEvent';
import type { ActivityEvent } from '@/services/events/types';

function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: 'evt-1',
    type: 'deposit',
    name: 'deposit',
    contractId: 'CVAULT',
    ledger: 42,
    timestamp: '2026-06-28T12:00:00.000Z',
    topics: ['deposit'],
    value: '100',
    ...overrides,
  };
}

describe('notificationFromActivityEvent', () => {
  it('maps deposit events to transaction notifications', () => {
    const input = notificationFromActivityEvent(makeEvent());
    expect(input.category).toBe('transaction');
    expect(input.priority).toBe('normal');
    expect(input.sourceId).toBe('evt-1');
    expect(input.id).toBe('activity:evt-1');
    expect(input.message).toContain('ledger #42');
  });

  it('maps governance events with higher priority', () => {
    const input = notificationFromActivityEvent(
      makeEvent({ type: 'governance', name: 'vote' }),
    );
    expect(input.category).toBe('governance');
    expect(input.priority).toBe('high');
  });

  it('maps reward events to reward category', () => {
    const input = notificationFromActivityEvent(makeEvent({ type: 'reward' }));
    expect(input.category).toBe('reward');
    expect(input.priority).toBe('high');
  });
});
