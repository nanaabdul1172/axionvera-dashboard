import { logger } from '@/logger/logger';
import { emit, DiagnosticEventType } from '@/diagnostics';

export enum MetricType {
  RENDER = 'render',
  API_CALL = 'api_call',
  COMPONENT_MOUNT = 'component_mount',
  DATA_FETCH = 'data_fetch',
  USER_INTERACTION = 'user_interaction',
  NAVIGATION = 'navigation',
  RESOURCE_LOAD = 'resource_load',
  MEMORY = 'memory',
}

export interface RuntimeMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percentage';
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceConfig {
  enabled: boolean;
  maxMarks: number;
  maxMetrics: number;
  slowThreshold: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  maxMarks: 500,
  maxMetrics: 1000,
  slowThreshold: 100,
};

let config: PerformanceConfig = { ...DEFAULT_CONFIG };
const marks = new Map<string, PerformanceMark>();
const completedMarks: PerformanceMark[] = [];
const runtimeMetrics: RuntimeMetric[] = [];

export function configurePerformance(options: Partial<PerformanceConfig>): void {
  config = { ...config, ...options };
}

export function startMark(name: string, metadata?: Record<string, unknown>): void {
  if (!config.enabled) return;
  marks.set(name, { name, startTime: performance.now(), metadata });
}

export function endMark(name: string, additionalMetadata?: Record<string, unknown>): number | null {
  if (!config.enabled) return null;

  const mark = marks.get(name);
  if (!mark) {
    logger.warn(`Performance mark "${name}" was not started`, undefined, 'performance');
    return null;
  }

  const endTime = performance.now();
  const duration = endTime - mark.startTime;

  const completed: PerformanceMark = {
    ...mark,
    endTime,
    duration,
    metadata: { ...mark.metadata, ...additionalMetadata },
  };

  completedMarks.push(completed);
  if (completedMarks.length > config.maxMarks) completedMarks.shift();
  marks.delete(name);

  if (duration > config.slowThreshold) {
    emit(DiagnosticEventType.PERFORMANCE_WARNING, {
      source: name,
      data: { duration, threshold: config.slowThreshold },
      duration,
      level: 'warn',
    });
  }

  return duration;
}

export function measureAsync<T>(
  name: string,
  type: MetricType,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  return fn()
    .then(result => {
      const duration = performance.now() - start;
      recordMetric(name, type, duration, 'ms', metadata as Record<string, string>);
      return result;
    })
    .catch(err => {
      const duration = performance.now() - start;
      recordMetric(name, type, duration, 'ms', { error: String(err) });
      throw err;
    });
}

export function measureSync<T>(
  name: string,
  type: MetricType,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    recordMetric(name, type, duration, 'ms', metadata as Record<string, string>);
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    recordMetric(name, type, duration, 'ms', { error: String(err) });
    throw err;
  }
}

export function recordMetric(
  name: string,
  type: MetricType,
  value: number,
  unit: RuntimeMetric['unit'] = 'ms',
  tags?: Record<string, string>
): RuntimeMetric {
  if (!config.enabled) {
    return { name, type, value, unit, timestamp: Date.now(), tags };
  }

  const metric: RuntimeMetric = {
    name,
    type,
    value,
    unit,
    timestamp: Date.now(),
    tags,
  };

  runtimeMetrics.push(metric);
  if (runtimeMetrics.length > config.maxMetrics) runtimeMetrics.shift();

  logger.debug(`[metric] ${name}: ${value}${unit}`, { type, ...tags });

  return metric;
}

export function getMarks(): PerformanceMark[] {
  return [...completedMarks];
}

export function getMarksByType(name: string): PerformanceMark[] {
  return completedMarks.filter(m => m.name === name);
}

export function getMetrics(): RuntimeMetric[] {
  return [...runtimeMetrics];
}

export function getMetricsByType(type: MetricType): RuntimeMetric[] {
  return runtimeMetrics.filter(m => m.type === type);
}

export function getMetricStats(name: string): {
  count: number;
  total: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const metrics = runtimeMetrics.filter(
    m => m.name === name && m.unit === 'ms' && m.value >= 0
  );
  if (metrics.length === 0) return null;

  const values = metrics.map(m => m.value).sort((a, b) => a - b);
  const total = values.reduce((s, v) => s + v, 0);

  return {
    count: values.length,
    total,
    avg: total / values.length,
    min: values[0],
    max: values[values.length - 1],
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
  };
}

function percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function getAggregatedMetrics(): {
  byType: Record<string, { count: number; avgMs: number; totalMs: number }>;
} {
  const byType: Record<string, number[]> = {};
  runtimeMetrics.forEach(m => {
    if (m.unit !== 'ms') return;
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m.value);
  });

  const result: Record<string, { count: number; avgMs: number; totalMs: number }> = {};
  Object.entries(byType).forEach(([type, values]) => {
    const total = values.reduce((s, v) => s + v, 0);
    result[type] = { count: values.length, avgMs: total / values.length, totalMs: total };
  });

  return { byType: result };
}

export function clearMetrics(): void {
  runtimeMetrics.length = 0;
}

export function clearMarks(): void {
  marks.clear();
  completedMarks.length = 0;
}

export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
  if (typeof window === 'undefined' || !(performance as any).memory) return null;
  const mem = (performance as any).memory;
  return {
    used: mem.usedJSHeapSize,
    total: mem.totalJSHeapSize,
    percentage: (mem.usedJSHeapSize / mem.totalJSHeapSize) * 100,
  };
}
