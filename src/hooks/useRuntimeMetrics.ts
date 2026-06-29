import { useEffect, useRef, useCallback, useState } from 'react';
import {
  MetricType,
  RuntimeMetric,
  PerformanceMark,
  startMark,
  endMark,
  recordMetric,
  getMetrics,
  getMarks,
  getMetricStats,
  getAggregatedMetrics,
  clearMetrics,
  clearMarks,
} from '@/performance';

export function useRenderTiming(componentName: string) {
  const renderStart = useRef<number>(0);
  renderStart.current = performance.now();

  useEffect(() => {
    const duration = performance.now() - renderStart.current;
    recordMetric(`${componentName}:render`, MetricType.RENDER, duration, 'ms', { component: componentName });
  });
}

export function useComponentTiming(componentName: string) {
  const markName = `${componentName}:lifecycle`;

  useEffect(() => {
    startMark(markName, { component: componentName });
    return () => {
      endMark(markName);
    };
  }, [componentName, markName]);
}

export function useAsyncTiming<T extends (...args: never[]) => Promise<unknown>>(
  name: string,
  asyncFn: T
): T {
  return useCallback(
    (async (...args: Parameters<T>) => {
      startMark(name);
      try {
        const result = await asyncFn(...args);
        endMark(name);
        return result;
      } catch (err) {
        endMark(name, { error: String(err) });
        throw err;
      }
    }) as T,
    [name, asyncFn]
  );
}

export function useMetricsSnapshot(refreshMs: number = 3000): {
  metrics: RuntimeMetric[];
  marks: PerformanceMark[];
  aggregated: ReturnType<typeof getAggregatedMetrics>;
} {
  const [snapshot, setSnapshot] = useState({
    metrics: getMetrics(),
    marks: getMarks(),
    aggregated: getAggregatedMetrics(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshot({
        metrics: getMetrics(),
        marks: getMarks(),
        aggregated: getAggregatedMetrics(),
      });
    }, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  return snapshot;
}

export function useSlowRenderDetection(
  componentName: string,
  threshold: number = 16
): void {
  const renderStart = useRef<number>(0);
  renderStart.current = performance.now();

  useEffect(() => {
    const duration = performance.now() - renderStart.current;
    if (duration > threshold) {
      recordMetric(
        `${componentName}:slow-render`,
        MetricType.RENDER,
        duration,
        'ms',
        { component: componentName, threshold: String(threshold) }
      );
    }
  });
}

export function usePerformanceCleanup(): () => void {
  return useCallback(() => {
    clearMetrics();
    clearMarks();
  }, []);
}

export function useMetricStats(name: string) {
  const [stats, setStats] = useState(getMetricStats(name));

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getMetricStats(name));
    }, 2000);
    return () => clearInterval(interval);
  }, [name]);

  return stats;
}
