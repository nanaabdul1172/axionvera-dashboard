import { EventIndexer } from './eventIndexer';
import type { ActivityEvent } from '@/services/events/types';
import type { EventFetcher } from '@/services/events/types';

const mockEvent = (id: string, type: any = 'deposit', timestamp: string = '2026-01-01T00:00:00Z'): ActivityEvent => ({
  id,
  type,
  name: 'mock_event',
  contractId: 'CCONTRACT',
  ledger: 100,
  timestamp,
  topics: [],
  value: {},
});

describe('EventIndexer', () => {
  let indexer: EventIndexer;

  beforeEach(() => {
    indexer = new EventIndexer({
      maxEvents: 10,
      retentionPeriodMs: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years for tests
    });
  });

  test('adds and queries events', () => {
    const event = mockEvent('1');
    indexer.addEvent(event);
    const result = indexer.query();
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('1');
    expect(result.total).toBe(1);
  });

  test('avoids duplicate events', () => {
    const event = mockEvent('1');
    indexer.addEvent(event);
    indexer.addEvent(event);
    const result = indexer.query();
    expect(result.events).toHaveLength(1);
  });

  test('filters by type', () => {
    indexer.addEvents([
      mockEvent('1', 'deposit'),
      mockEvent('2', 'withdrawal'),
    ]);
    const result = indexer.query({ types: ['deposit'] });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('1');
  });

  test('filters by date range', () => {
    indexer.addEvents([
      mockEvent('1', 'deposit', '2026-01-01T10:00:00Z'),
      mockEvent('2', 'deposit', '2026-01-01T12:00:00Z'),
      mockEvent('3', 'deposit', '2026-01-01T14:00:00Z'),
    ]);
    const result = indexer.query({
      startDate: '2026-01-01T11:00:00Z',
      endDate: '2026-01-01T13:00:00Z',
    });
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('2');
  });

  test('pagination works', () => {
    const events = Array.from({ length: 5 }, (_, i) => mockEvent(i.toString(), 'deposit', `2026-01-01T10:00:0${i}Z`));
    indexer.addEvents(events);

    const page1 = indexer.query({ limit: 2, offset: 0, order: 'asc' });
    expect(page1.events).toHaveLength(2);
    expect(page1.events[0].id).toBe('0');
    expect(page1.hasMore).toBe(true);
    expect(page1.total).toBe(5);

    const page2 = indexer.query({ limit: 2, offset: 2, order: 'asc' });
    expect(page2.events).toHaveLength(2);
    expect(page2.events[0].id).toBe('2');

    const page3 = indexer.query({ limit: 2, offset: 4, order: 'asc' });
    expect(page3.events).toHaveLength(1);
    expect(page3.events[0].id).toBe('4');
    expect(page3.hasMore).toBe(false);
  });

  test('enforces maxEvents retention', () => {
    const events = Array.from({ length: 15 }, (_, i) => mockEvent(i.toString(), 'deposit', `2026-01-01T10:00:${i < 10 ? '0' + i : i}Z`));
    indexer.addEvents(events);
    const result = indexer.query();
    expect(result.events).toHaveLength(10);
    // Should keep the newest 10
    expect(result.events.some(e => e.id === '0')).toBe(false);
    expect(result.events.some(e => e.id === '14')).toBe(true);
  });

  test('calculates analytics', () => {
    indexer.addEvents([
      mockEvent('1', 'deposit'),
      mockEvent('2', 'deposit'),
      mockEvent('3', 'withdrawal'),
    ]);
    const stats = indexer.getAnalytics();
    expect(stats.totalEvents).toBe(3);
    expect(stats.countByType.deposit).toBe(2);
    expect(stats.countByType.withdrawal).toBe(1);
  });

  test('fetches history', async () => {
    const mockFetcher: EventFetcher = {
      getLatestLedger: jest.fn().mockResolvedValue(200),
      getEvents: jest.fn().mockResolvedValue({
        events: [
          {
            id: 'h1',
            topic: ['deposit'],
            contractId: 'CCONTRACT',
            ledger: 50,
            ledgerClosedAt: '2026-01-01T00:00:00Z',
            value: '10',
          }
        ],
        latestLedger: 150
      })
    };

    await indexer.fetchHistory({
      fetcher: mockFetcher,
      startLedger: 1,
      contractIds: ['CCONTRACT']
    });

    const result = indexer.query();
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('h1');
  });
});
