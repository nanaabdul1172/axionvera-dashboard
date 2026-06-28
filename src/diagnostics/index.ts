import { logger } from '@/logger/logger';

export enum DiagnosticEventType {
  COMPONENT_MOUNT = 'component.mount',
  COMPONENT_UNMOUNT = 'component.unmount',
  COMPONENT_UPDATE = 'component.update',
  API_REQUEST = 'api.request',
  API_SUCCESS = 'api.success',
  API_ERROR = 'api.error',
  NAVIGATION = 'navigation',
  USER_ACTION = 'user.action',
  STATE_CHANGE = 'state.change',
  PERFORMANCE_WARNING = 'performance.warning',
  ERROR_BOUNDARY = 'error.boundary',
  NETWORK_STATUS = 'network.status',
  RESOURCE_LOAD = 'resource.load',
}

export interface DiagnosticEvent {
  type: DiagnosticEventType | string;
  source?: string;
  data?: Record<string, unknown>;
  timestamp: string;
  duration?: number;
  level: 'info' | 'warn' | 'error';
}

interface DiagnosticConfig {
  maxEvents: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: DiagnosticConfig = {
  maxEvents: 200,
  enabled: true,
};

let config: DiagnosticConfig = { ...DEFAULT_CONFIG };
const buffer: DiagnosticEvent[] = [];

export function configureDiagnostics(options: Partial<DiagnosticConfig>): void {
  config = { ...config, ...options };
}

export function emit(
  type: DiagnosticEventType | string,
  options?: {
    source?: string;
    data?: Record<string, unknown>;
    duration?: number;
    level?: 'info' | 'warn' | 'error';
  }
): DiagnosticEvent {
  if (!config.enabled) {
    return { type, timestamp: new Date().toISOString(), level: 'info' };
  }

  const event: DiagnosticEvent = {
    type,
    source: options?.source,
    data: options?.data,
    timestamp: new Date().toISOString(),
    duration: options?.duration,
    level: options?.level || 'info',
  };

  buffer.unshift(event);
  if (buffer.length > config.maxEvents) buffer.pop();

  logger.debug(`[diag] ${event.type}`, {
    source: event.source,
    duration: event.duration,
    ...event.data,
  });

  return event;
}

export function getEvents(
  filter?: { type?: DiagnosticEventType | string; level?: 'info' | 'warn' | 'error'; since?: Date }
): DiagnosticEvent[] {
  let events = [...buffer];
  if (filter) {
    if (filter.type) events = events.filter(e => e.type === filter.type);
    if (filter.level) events = events.filter(e => e.level === filter.level);
    if (filter.since) events = events.filter(e => new Date(e.timestamp) >= filter.since!);
  }
  return events;
}

export function getEventsByType(type: DiagnosticEventType | string): DiagnosticEvent[] {
  return buffer.filter(e => e.type === type);
}

export function getErrorEvents(): DiagnosticEvent[] {
  return buffer.filter(e => e.level === 'error');
}

export function getWarningEvents(): DiagnosticEvent[] {
  return buffer.filter(e => e.level === 'warn');
}

export function clear(): void {
  buffer.length = 0;
}

export function getStats(): {
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  recentErrors: number;
} {
  const byType: Record<string, number> = {};
  const byLevel: Record<string, number> = { info: 0, warn: 0, error: 0 };
  let recentErrors = 0;
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;

  buffer.forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byLevel[e.level] = (byLevel[e.level] || 0) + 1;
    if (e.level === 'error' && new Date(e.timestamp).getTime() > fiveMinAgo) {
      recentErrors++;
    }
  });

  return { total: buffer.length, byType, byLevel, recentErrors };
}
