import { mapRawEvents } from '@/services/events/eventMapper';
import type {
  ActivityEvent,
  ActivityType,
  EventFetcher,
} from '@/services/events/types';
import type {
  EventAnalytics,
  EventQueryOptions,
  EventQueryResult,
  IndexerConfig,
} from './types';

const DEFAULT_CONFIG: Required<IndexerConfig> = {
  maxEvents: 10000,
  retentionPeriodMs: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * In-memory indexer for protocol events.
 * Provides efficient querying, filtering, and basic analytics.
 */
export class EventIndexer {
  private events: ActivityEvent[] = [];
  private readonly config: Required<IndexerConfig>;

  constructor(config: IndexerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a single event to the index.
   */
  addEvent(event: ActivityEvent): void {
    // Avoid duplicates
    if (this.events.some((e) => e.id === event.id)) {
      return;
    }

    this.events.push(event);
    this.sortEvents();
    this.enforceRetention();
  }

  /**
   * Add multiple events to the index.
   */
  addEvents(events: ActivityEvent[]): void {
    const newEvents = events.filter(
      (event) => !this.events.some((e) => e.id === event.id)
    );

    if (newEvents.length === 0) return;

    this.events.push(...newEvents);
    this.sortEvents();
    this.enforceRetention();
  }

  /**
   * Clear all indexed events.
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Query indexed events with filtering and pagination.
   */
  query(options: EventQueryOptions = {}): EventQueryResult {
    let filtered = [...this.events];

    const {
      types,
      contractIds,
      names,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      order = 'desc',
    } = options;

    // Apply filters
    if (types && types.length > 0) {
      filtered = filtered.filter((e) => types.includes(e.type));
    }

    if (contractIds && contractIds.length > 0) {
      filtered = filtered.filter((e) => contractIds.includes(e.contractId));
    }

    if (names && names.length > 0) {
      filtered = filtered.filter((e) => names.includes(e.name));
    }

    if (startDate) {
      const startTs = new Date(startDate).getTime();
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= startTs);
    }

    if (endDate) {
      const endTs = new Date(endDate).getTime();
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= endTs);
    }

    // Sort
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return order === 'desc' ? timeB - timeA : timeA - timeB;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Fetch and index historical events.
   */
  async fetchHistory(params: {
    fetcher: EventFetcher;
    startLedger: number;
    contractIds: string[];
    limit?: number;
  }): Promise<void> {
    const { fetcher, startLedger, contractIds, limit = 100 } = params;

    try {
      const { events } = await fetcher.getEvents({
        startLedger,
        contractIds,
        limit,
      });

      const normalizedEvents = mapRawEvents(
        events as Record<string, unknown>[]
      );
      this.addEvents(normalizedEvents);
    } catch (error) {
      console.error('Failed to fetch historical events:', error);
      throw error;
    }
  }

  /**
   * Get basic analytics from the indexed events.
   */
  getAnalytics(): EventAnalytics {
    const countByType: Record<ActivityType, number> = {
      deposit: 0,
      withdrawal: 0,
      reward: 0,
      governance: 0,
      unknown: 0,
    };

    let minDate: number | null = null;
    let maxDate: number | null = null;

    this.events.forEach((e) => {
      countByType[e.type] = (countByType[e.type] || 0) + 1;

      const ts = new Date(e.timestamp).getTime();
      if (minDate === null || ts < minDate) minDate = ts;
      if (maxDate === null || ts > maxDate) maxDate = ts;
    });

    return {
      countByType,
      totalEvents: this.events.length,
      timeRange: {
        start: minDate ? new Date(minDate).toISOString() : null,
        end: maxDate ? new Date(maxDate).toISOString() : null,
      },
    };
  }

  private sortEvents(): void {
    this.events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Default internal storage: newest first
    });
  }

  private enforceRetention(): void {
    // Enforce max count
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(0, this.config.maxEvents);
    }

    // Enforce retention period
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriodMs;

    this.events = this.events.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      return ts >= cutoff;
    });
  }
}

/**
 * Shared singleton instance of the EventIndexer.
 */
let instance: EventIndexer | null = null;

export function getEventIndexer(): EventIndexer {
  if (!instance) {
    instance = new EventIndexer();
  }
  return instance;
}
