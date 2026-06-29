import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { resourceScheduler } from '@/scheduler';
import type { ScheduledTask, SchedulerSnapshot, SchedulerState, SchedulerTaskType } from '@/scheduler';

const listeners = new Set<() => void>();

function emitChange(): void {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SchedulerSnapshot {
  return resourceScheduler.getSnapshot();
}

export function useSchedulerState(state: SchedulerState): void {
  useEffect(() => {
    resourceScheduler.setState(state);
    emitChange();
  }, [state]);
}

export function useResourceScheduler(): {
  snapshot: SchedulerSnapshot;
  schedule: <T>(task: Omit<ScheduledTask<T>, 'priority'> & { priority?: ScheduledTask<T>['priority'] }) => Promise<T>;
  scheduleRender: <T>(name: string, run: ScheduledTask<T>['run']) => Promise<T>;
  scheduleApi: <T>(name: string, run: ScheduledTask<T>['run']) => Promise<T>;
  scheduleBackgroundSync: <T>(name: string, run: ScheduledTask<T>['run']) => Promise<T>;
  scheduleCompute: <T>(name: string, run: ScheduledTask<T>['run']) => Promise<T>;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const schedule = useCallback(<T,>(task: Omit<ScheduledTask<T>, 'priority'> & { priority?: ScheduledTask<T>['priority'] }) => {
    emitChange();
    return resourceScheduler.schedule(task).finally(emitChange);
  }, []);

  const scheduleTyped = useCallback(<T,>(type: SchedulerTaskType, name: string, run: ScheduledTask<T>['run']) => (
    schedule({ id: `${type}:${name}:${Date.now()}`, type, name, run })
  ), [schedule]);

  return {
    snapshot,
    schedule,
    scheduleRender: (name, run) => scheduleTyped('render', name, run),
    scheduleApi: (name, run) => scheduleTyped('api', name, run),
    scheduleBackgroundSync: (name, run) => scheduleTyped('sync', name, run),
    scheduleCompute: (name, run) => scheduleTyped('compute', name, run),
  };
}
