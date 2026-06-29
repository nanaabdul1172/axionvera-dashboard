import { getEventIndexer } from '@/indexing/eventIndexer';
import { mapRawEvents } from './eventMapper';
import type {
  ActivityEvent,
  ConnectionStatus,
  EventFetcher,
  EventListener,
  StatusListener,
} from './types';

export interface EventSubscriptionOptions {
  /** Contract ids to stream events for. */
  contractIds: string[];
  /** Data source. Injectable for testing; defaults to a Soroban RPC poller. */
  fetcher: EventFetcher;
  /** Delay between successful polls. */
  pollIntervalMs?: number;
  /** Max consecutive failures before giving up and surfacing `error`. */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff. */
  baseReconnectDelayMs?: number;
  /** Upper bound for a single backoff delay. */
  maxReconnectDelayMs?: number;
  /** Page size requested from the fetcher. */
  pageLimit?: number;
  /** Cap on the dedupe id cache to bound memory. */
  dedupeCacheSize?: number;
}

const DEFAULTS = {
  pollIntervalMs: 5000,
  maxReconnectAttempts: 10,
  baseReconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  pageLimit: 100,
  dedupeCacheSize: 1000,
};

type ResolvedOptions = Required<EventSubscriptionOptions>;

/**
 * Streams protocol events in real time by polling a {@link EventFetcher}
 * (Soroban RPC `getEvents` by default) and emitting normalized
 * {@link ActivityEvent}s.
 *
 * Responsibilities (issue #215):
 * - **Subscription** — `onEvent` / `onStatusChange` with unsubscribe handles.
 * - **Reconnection** — consecutive failures retry with capped exponential
 *   backoff; the ledger cursor is preserved so no events are missed across a
 *   reconnect, and the service surfaces `reconnecting` then `error` if it
 *   exhausts `maxReconnectAttempts`.
 * - **Deduplication** — events already emitted (by id) are dropped, with a
 *   bounded cache so long-lived streams don't grow unbounded.
 */
export class EventSubscriptionService {
  private readonly opts: ResolvedOptions;
  private readonly listeners = new Set<EventListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private readonly seenIds = new Set<string>();

  private status: ConnectionStatus = 'idle';
  private cursor: number | null = null;
  private reconnectAttempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(options: EventSubscriptionOptions) {
    this.opts = { ...DEFAULTS, ...options };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Subscribe to normalized events. Returns an unsubscribe function. */
  onEvent(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe function. */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /** Begin streaming. Idempotent. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.reconnectAttempts = 0;
    this.setStatus('connecting');
    this.schedule(0);
  }

  /** Stop streaming and clear any pending timer. */
  stop(): void {
    if (!this.running && this.status === 'disconnected') return;
    this.running = false;
    this.clearTimer();
    this.setStatus('disconnected');
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(delayMs: number): void {
    if (!this.running) return;
    this.clearTimer();
    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      // Establish the start cursor from the current ledger on first run (or
      // after a bootstrap failure) so we stream from "now" forward.
      if (this.cursor === null) {
        this.cursor = await this.opts.fetcher.getLatestLedger();
      }

      const { events, latestLedger } = await this.opts.fetcher.getEvents({
        startLedger: this.cursor,
        contractIds: this.opts.contractIds,
        limit: this.opts.pageLimit,
      });

      this.emitNew(events);

      // Advance the cursor past the latest processed ledger.
      if (typeof latestLedger === 'number' && latestLedger >= this.cursor) {
        this.cursor = latestLedger + 1;
      }

      if (!this.running) return;
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.schedule(this.opts.pollIntervalMs);
    } catch {
      this.handleFailure();
    }
  }

  private handleFailure(): void {
    if (!this.running) return;
    this.reconnectAttempts += 1;

    if (this.reconnectAttempts > this.opts.maxReconnectAttempts) {
      // Give up; consumer can call start() again to retry from scratch.
      this.running = false;
      this.clearTimer();
      this.setStatus('error');
      return;
    }

    this.setStatus('reconnecting');
    this.schedule(this.backoffDelay());
  }

  /** Capped exponential backoff for the current attempt. */
  private backoffDelay(): number {
    const exp = this.opts.baseReconnectDelayMs * 2 ** (this.reconnectAttempts - 1);
    return Math.min(exp, this.opts.maxReconnectDelayMs);
  }

  private emitNew(rawEvents: unknown[]): void {
    const events = mapRawEvents(rawEvents as Record<string, unknown>[]);
    const indexer = getEventIndexer();
    const newEvents: ActivityEvent[] = [];

    for (const event of events) {
      if (this.seenIds.has(event.id)) continue;
      this.rememberId(event.id);
      newEvents.push(event);
    }

    if (newEvents.length > 0) {
      // Index the events for later querying/analytics
      indexer.addEvents(newEvents);

      for (const event of newEvents) {
        this.listeners.forEach((cb) => cb(event));
      }
    }
  }

  private rememberId(id: string): void {
    this.seenIds.add(id);
    if (this.seenIds.size > this.opts.dedupeCacheSize) {
      // Evict the oldest half to keep the cache bounded.
      const drop = Math.floor(this.opts.dedupeCacheSize / 2);
      let i = 0;
      for (const old of this.seenIds) {
        if (i++ >= drop) break;
        this.seenIds.delete(old);
      }
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }
}

export function createEventSubscriptionService(
  options: EventSubscriptionOptions,
): EventSubscriptionService {
  return new EventSubscriptionService(options);
}

export type { ActivityEvent };
