import { recordMetric, MetricType } from '@/performance';
import { priorityForTask, PRIORITY_WEIGHT, shouldDefer } from './policies';
import type {
  ScheduledTask,
  SchedulerOptions,
  SchedulerPriority,
  SchedulerSnapshot,
  SchedulerState,
  TaskExecutionRecord,
} from './types';

type QueueEntry<T> = ScheduledTask<T> & {
  sequence: number;
  controller: AbortController;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  scheduledAt: number;
};

const DEFAULT_OPTIONS: SchedulerOptions = {
  maxConcurrent: 2,
  frameBudgetMs: 8,
  backgroundDelayMs: 50,
  now: () => performance.now(),
  scheduleMacrotask: (callback, delayMs) => setTimeout(callback, delayMs),
  cancelMacrotask: handle => clearTimeout(handle),
};

export class ResourceScheduler {
  private readonly options: SchedulerOptions;
  private state: SchedulerState = 'settled';
  private queue: QueueEntry<unknown>[] = [];
  private running = 0;
  private sequence = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private history: TaskExecutionRecord[] = [];

  constructor(options: Partial<SchedulerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  setState(state: SchedulerState): void {
    this.state = state;
    this.scheduleDrain(0);
  }

  schedule<T>(task: Omit<ScheduledTask<T>, 'priority'> & { priority?: SchedulerPriority }): Promise<T> {
    const priority = task.priority ?? priorityForTask(task.type, this.state);

    return new Promise<T>((resolve, reject) => {
      const entry: QueueEntry<T> = {
        ...task,
        priority,
        sequence: this.sequence++,
        controller: new AbortController(),
        resolve,
        reject,
        scheduledAt: this.options.now(),
      };

      this.queue.push(entry as QueueEntry<unknown>);
      this.sortQueue();
      this.scheduleDrain(shouldDefer(priority, this.state) ? this.options.backgroundDelayMs : 0);
    });
  }

  cancel(id: string): boolean {
    const index = this.queue.findIndex(task => task.id === id);
    if (index === -1) return false;
    const [entry] = this.queue.splice(index, 1);
    entry.controller.abort();
    entry.reject(new DOMException(`Scheduled task "${id}" was cancelled`, 'AbortError'));
    return true;
  }

  getSnapshot(): SchedulerSnapshot {
    return {
      state: this.state,
      pending: this.queue.length,
      running: this.running,
      completed: this.history.length,
      lastExecution: this.history[this.history.length - 1],
    };
  }

  getHistory(): TaskExecutionRecord[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  private scheduleDrain(delayMs: number): void {
    if (this.timer) this.options.cancelMacrotask(this.timer);
    this.timer = this.options.scheduleMacrotask(() => {
      this.timer = null;
      void this.drain();
    }, delayMs);
  }

  private async drain(): Promise<void> {
    const frameStarted = this.options.now();

    while (this.running < this.options.maxConcurrent && this.queue.length > 0) {
      const next = this.queue[0];
      if (shouldDefer(next.priority, this.state)) {
        this.scheduleDrain(this.options.backgroundDelayMs);
        return;
      }

      if (this.options.now() - frameStarted > this.options.frameBudgetMs && next.priority !== 'immediate') {
        this.scheduleDrain(0);
        return;
      }

      this.queue.shift();
      this.execute(next);
    }
  }

  private execute<T>(entry: QueueEntry<T>): void {
    this.running += 1;
    const startedAt = this.options.now();
    const timeoutHandle = entry.timeoutMs
      ? this.options.scheduleMacrotask(() => entry.controller.abort(), entry.timeoutMs)
      : null;

    Promise.resolve()
      .then(() => entry.run({
        signal: entry.controller.signal,
        scheduledAt: entry.scheduledAt,
        startedAt,
        priority: entry.priority,
        type: entry.type,
      }))
      .then(result => {
        this.record(entry, startedAt, entry.controller.signal.aborted ? 'aborted' : 'completed');
        entry.resolve(result);
      })
      .catch(error => {
        this.record(entry, startedAt, entry.controller.signal.aborted ? 'aborted' : 'failed', error);
        entry.reject(error);
      })
      .finally(() => {
        if (timeoutHandle) this.options.cancelMacrotask(timeoutHandle);
        this.running -= 1;
        this.scheduleDrain(0);
      });
  }

  private record<T>(entry: QueueEntry<T>, startedAt: number, status: TaskExecutionRecord['status'], error?: unknown): void {
    const finishedAt = this.options.now();
    const durationMs = finishedAt - startedAt;
    const record: TaskExecutionRecord = {
      id: entry.id,
      name: entry.name,
      type: entry.type,
      priority: entry.priority,
      scheduledAt: entry.scheduledAt,
      startedAt,
      finishedAt,
      durationMs,
      status,
      error: error instanceof Error ? error.message : error ? String(error) : undefined,
      metadata: entry.metadata,
    };
    this.history.push(record);
    recordMetric(`scheduler.${entry.type}`, MetricType.RESOURCE_LOAD, durationMs, 'ms', {
      priority: entry.priority,
      status,
      name: entry.name,
    });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || a.sequence - b.sequence);
  }
}

export const resourceScheduler = new ResourceScheduler();
