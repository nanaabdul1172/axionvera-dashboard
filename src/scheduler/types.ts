export type SchedulerTaskType = 'render' | 'api' | 'sync' | 'compute';

export type SchedulerPriority = 'immediate' | 'user-blocking' | 'normal' | 'background' | 'idle';

export type SchedulerState = 'interactive' | 'settled' | 'background';

export interface SchedulerTaskContext {
  signal: AbortSignal;
  scheduledAt: number;
  startedAt: number;
  priority: SchedulerPriority;
  type: SchedulerTaskType;
}

export interface ScheduledTask<T = unknown> {
  id: string;
  name: string;
  type: SchedulerTaskType;
  priority: SchedulerPriority;
  run: (context: SchedulerTaskContext) => T | Promise<T>;
  timeoutMs?: number;
  metadata?: Record<string, string>;
}

export interface SchedulerOptions {
  maxConcurrent: number;
  frameBudgetMs: number;
  backgroundDelayMs: number;
  now: () => number;
  scheduleMacrotask: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  cancelMacrotask: (handle: ReturnType<typeof setTimeout>) => void;
}

export interface TaskExecutionRecord {
  id: string;
  name: string;
  type: SchedulerTaskType;
  priority: SchedulerPriority;
  scheduledAt: number;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  status: 'completed' | 'failed' | 'aborted';
  error?: string;
  metadata?: Record<string, string>;
}

export interface SchedulerSnapshot {
  state: SchedulerState;
  pending: number;
  running: number;
  completed: number;
  lastExecution?: TaskExecutionRecord;
}
