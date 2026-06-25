import { emit, getEvents, clear } from '../diagnostics';

describe('diagnostics', () => {
  afterEach(() => {
    clear();
  });

  it('should emit and retrieve events in LIFO order', () => {
    emit('test.event', { key: 'value' });
    emit('another.event');

    const events = getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('another.event');
    expect(events[1].type).toBe('test.event');
    expect(events[1].data).toEqual({ key: 'value' });
  });

  it('should include a timestamp', () => {
    emit('ping');
    const events = getEvents();
    expect(events[0].timestamp).toBeDefined();
    expect(() => new Date(events[0].timestamp)).not.toThrow();
  });

  it('should clear all events', () => {
    emit('a');
    emit('b');
    expect(getEvents()).toHaveLength(2);
    clear();
    expect(getEvents()).toHaveLength(0);
  });

  it('should cap at MAX_EVENTS', () => {
    for (let i = 0; i < 150; i++) {
      emit(`event-${i}`);
    }
    expect(getEvents()).toHaveLength(100);
    expect(getEvents()[0].type).toBe('event-149');
  });
});
