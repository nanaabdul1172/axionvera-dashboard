import { ActivityStore } from './activityStore';
import type { ActivityEvent } from '@/services/events/types';

function makeEvent(id: string, overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id,
    type: 'deposit',
    name: 'deposit',
    contractId: 'CVAULT',
    ledger: 1,
    timestamp: '2026-01-01T00:00:00Z',
    topics: ['deposit'],
    value: '1',
    ...overrides,
  };
}

describe('ActivityStore', () => {
  it('starts empty and idle', () => {
    const store = new ActivityStore();
    const snap = store.getSnapshot();
    expect(snap.events).toEqual([]);
    expect(snap.status).toBe('idle');
    expect(snap.lastUpdated).toBeNull();
  });

  it('adds events newest-first', () => {
    const store = new ActivityStore();
    store.addEvent(makeEvent('a'));
    store.addEvent(makeEvent('b'));
    expect(store.getSnapshot().events.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('ignores duplicate events by id', () => {
    const store = new ActivityStore();
    store.addEvent(makeEvent('a'));
    store.addEvent(makeEvent('a'));
    store.addEvents([makeEvent('a'), makeEvent('b')]);
    expect(store.getSnapshot().events.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('caps the feed at maxEvents', () => {
    const store = new ActivityStore(3);
    store.addEvents([
      makeEvent('a'),
      makeEvent('b'),
      makeEvent('c'),
      makeEvent('d'),
    ]);
    const ids = store.getSnapshot().events.map((e) => e.id);
    expect(ids).toHaveLength(3);
    expect(ids[0]).toBe('d'); // newest retained
  });

  it('updates status and notifies subscribers', () => {
    const store = new ActivityStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.setStatus('connected');
    expect(store.getSnapshot().status).toBe('connected');
    expect(listener).toHaveBeenCalledTimes(1);

    // No-op when status is unchanged.
    store.setStatus('connected');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setStatus('disconnected');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when only duplicates are added', () => {
    const store = new ActivityStore();
    store.addEvent(makeEvent('a'));
    const listener = jest.fn();
    store.subscribe(listener);
    store.addEvent(makeEvent('a'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('clears the feed', () => {
    const store = new ActivityStore();
    store.addEvents([makeEvent('a'), makeEvent('b')]);
    store.clear();
    expect(store.getSnapshot().events).toEqual([]);
  });
});
