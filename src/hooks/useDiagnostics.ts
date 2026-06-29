import { useEffect, useRef, useCallback, useState } from 'react';
import { emit, DiagnosticEventType, getEvents, getStats, DiagnosticEvent, clear } from '@/diagnostics';
import { logger } from '@/logger/logger';

export function useDiagnostics(componentName: string) {
  useEffect(() => {
    emit(DiagnosticEventType.COMPONENT_MOUNT, { source: componentName });
    return () => {
      emit(DiagnosticEventType.COMPONENT_UNMOUNT, { source: componentName });
    };
  }, [componentName]);

  const trackEvent = useCallback(
    (type: DiagnosticEventType | string, data?: Record<string, unknown>) => {
      emit(type, { source: componentName, data });
    },
    [componentName]
  );

  return { trackEvent };
}

export function useDiagnosticEvents(
  filter?: { type?: DiagnosticEventType | string; level?: 'info' | 'warn' | 'error' }
): DiagnosticEvent[] {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);

  useEffect(() => {
    setEvents(getEvents(filter));
    const interval = setInterval(() => {
      setEvents(getEvents(filter));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.type, filter?.level]);

  return events;
}

export function useDiagnosticStats(): ReturnType<typeof getStats> {
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

export function useErrorLogger(componentName: string) {
  const logError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      logger.error(error.message, { component: componentName, stack: error.stack, ...context }, componentName);
      emit(DiagnosticEventType.API_ERROR, {
        source: componentName,
        data: { error: error.message, stack: error.stack, ...context },
        level: 'error',
      });
    },
    [componentName]
  );

  const logWarning = useCallback(
    (message: string, context?: Record<string, unknown>) => {
      logger.warn(message, { component: componentName, ...context }, componentName);
      emit(DiagnosticEventType.PERFORMANCE_WARNING, {
        source: componentName,
        data: { message, ...context },
        level: 'warn',
      });
    },
    [componentName]
  );

  return { logError, logWarning };
}

export function useDiagnosticBuffer(componentName: string) {
  const eventBuffer = useRef<DiagnosticEvent[]>([]);

  useEffect(() => {
    eventBuffer.current = getEvents();
  }, []);

  const flush = useCallback(() => {
    const events = eventBuffer.current;
    eventBuffer.current = [];
    return events;
  }, []);

  const clearBuffer = useCallback(() => {
    clear();
    eventBuffer.current = [];
  }, []);

  return { flush, clearBuffer };
}
