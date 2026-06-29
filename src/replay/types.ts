export interface ProtocolEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface StateReconstructor<S> {
  initialState: S;
  applyEvent: (state: S, event: ProtocolEvent) => S;
}

export interface EventStore {
  getEvents: (options?: {
    startId?: string;
    endId?: string;
    limit?: number;
    types?: string[];
  }) => Promise<ProtocolEvent[]>;
  addEvent: (event: ProtocolEvent) => Promise<void>;
}

export interface InMemoryEventStoreOptions {
  events?: ProtocolEvent[];
}

export interface ReplayStep {
  index: number;
  event: ProtocolEvent;
  stateBefore: unknown;
  stateAfter: unknown;
  success: boolean;
  error?: Error;
}

export interface ReplayReport {
  startedAt: number;
  finishedAt: number;
  totalEvents: number;
  successCount: number;
  errorCount: number;
  steps: ReplayStep[];
  finalState: unknown;
}

export interface ReplayOptions {
  maxEvents?: number;
  eventTypes?: string[];
  onStep?: (step: ReplayStep) => void;
}
