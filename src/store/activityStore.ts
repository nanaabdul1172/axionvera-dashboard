import type { ActivityEvent, ConnectionStatus } from '@/services/events/types';

export interface ActivityState {
  /** Most-recent-first list of activity events. */
  events: ActivityEvent[];
  /** Current stream connection status. */
  status: ConnectionStatus;
  /** Epoch ms of the last state change (null until first update). */
  lastUpdated: number | null;
}

/** Max events retained in the feed to bound memory/DOM size. */
const DEFAULT_MAX_EVENTS = 200;

/**
 * Minimal framework-agnostic observable store for dashboard activity.
 *
 * Decoupled from React (consumed via `useSyncExternalStore` in
 * {@link useActivityFeed}) so it is trivially unit-testable and can be driven
 * by the event subscription service. Adding events is idempotent: duplicates
 * (by id) are ignored, mirroring the service-level dedupe so the UI never shows
 * the same event twice even if a reconnect re-delivers it.
 */
export class ActivityStore {
  private state: ActivityState = {
    events: [],
    status: 'idle',
    lastUpdated: null,
  };

  private readonly listeners = new Set<() => void>();
  private readonly seenIds = new Set<string>();
  private readonly maxEvents: number;

  constructor(maxEvents: number = DEFAULT_MAX_EVENTS) {
    this.maxEvents = maxEvents;
    // Pre-bind so `useSyncExternalStore` gets a stable subscribe reference.
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): ActivityState {
    return this.state;
  }

  /** Add one event (newest first), ignoring duplicates by id. */
  addEvent(event: ActivityEvent): void {
    this.addEvents([event]);
  }

  /** Add a batch of events, ignoring duplicates and capping the list size. */
  addEvents(incoming: ActivityEvent[]): void {
    const fresh = incoming.filter((e) => !this.seenIds.has(e.id));
    if (fresh.length === 0) return;

    fresh.forEach((e) => this.seenIds.add(e.id));
    const merged = [...fresh.reverse(), ...this.state.events].slice(0, this.maxEvents);

    // Keep the dedupe set aligned with what's actually retained.
    if (this.seenIds.size > this.maxEvents * 2) {
      this.seenIds.clear();
      merged.forEach((e) => this.seenIds.add(e.id));
    }

    this.state = { ...this.state, events: merged, lastUpdated: Date.now() };
    this.emit();
  }

  setStatus(status: ConnectionStatus): void {
    if (this.state.status === status) return;
    this.state = { ...this.state, status, lastUpdated: Date.now() };
    this.emit();
  }

  clear(): void {
    this.seenIds.clear();
    this.state = { ...this.state, events: [], lastUpdated: Date.now() };
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb());
  }
}

/** Shared store instance used by the dashboard. */
export const activityStore = new ActivityStore();
