import type { ActivityEvent, ActivityType } from '@/services/events/types';

/**
 * Options for querying the event index.
 */
export interface EventQueryOptions {
  /** Filter by event categories. */
  types?: ActivityType[];
  /** Filter by contract addresses. */
  contractIds?: string[];
  /** Filter by event name (first topic). */
  names?: string[];
  /** Start of the time range (ISO string or timestamp). */
  startDate?: string | number;
  /** End of the time range (ISO string or timestamp). */
  endDate?: string | number;
  /** Max number of events to return. */
  limit?: number;
  /** Number of events to skip. */
  offset?: number;
  /** Sort order by timestamp. Defaults to 'desc'. */
  order?: 'asc' | 'desc';
}

/**
 * Result of an event index query.
 */
export interface EventQueryResult {
  /** The matched events. */
  events: ActivityEvent[];
  /** Total number of events matching the filter (ignoring limit/offset). */
  total: number;
  /** Indicates if there are more pages available. */
  hasMore: boolean;
}

/**
 * Basic analytics derived from indexed events.
 */
export interface EventAnalytics {
  /** Count of events grouped by type. */
  countByType: Record<ActivityType, number>;
  /** Total number of indexed events. */
  totalEvents: number;
  /** Time range covered by the index. */
  timeRange: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Configuration for the EventIndexer.
 */
export interface IndexerConfig {
  /** Max number of events to keep in memory. */
  maxEvents?: number;
  /** Max age of events to keep in memory (in milliseconds). */
  retentionPeriodMs?: number;
}
