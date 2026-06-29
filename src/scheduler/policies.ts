import type { SchedulerPriority, SchedulerState, SchedulerTaskType } from './types';

export const PRIORITY_WEIGHT: Record<SchedulerPriority, number> = {
  immediate: 0,
  'user-blocking': 1,
  normal: 2,
  background: 3,
  idle: 4,
};

export function priorityForTask(type: SchedulerTaskType, state: SchedulerState): SchedulerPriority {
  if (state === 'interactive') {
    if (type === 'render') return 'user-blocking';
    if (type === 'api') return 'normal';
    return 'background';
  }

  if (state === 'background') {
    if (type === 'sync' || type === 'compute') return 'normal';
    return type === 'render' ? 'user-blocking' : 'normal';
  }

  if (type === 'render') return 'user-blocking';
  if (type === 'api') return 'normal';
  if (type === 'sync') return 'background';
  return 'idle';
}

export function shouldDefer(priority: SchedulerPriority, state: SchedulerState): boolean {
  return state === 'interactive' && (priority === 'background' || priority === 'idle');
}
