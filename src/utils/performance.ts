import React from "react";

/**
 * @module utils/performance
 *
 * Performance monitoring and optimization utilities.
 * Provides tools for measuring, tracking, and improving application performance.
 */

/**
 * Performance metric types.
 */
export enum MetricType {
  RENDER = "render",
  API_CALL = "api_call",
  COMPONENT_MOUNT = "component_mount",
  DATA_FETCH = "data_fetch",
  USER_INTERACTION = "user_interaction",
}

/**
 * Performance metric data.
 */
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Performance metrics store.
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completed: PerformanceMetric[] = [];
  private enabled: boolean = typeof window !== "undefined" && process.env.NODE_ENV === "development";

  /**
   * Start tracking a performance metric.
   */
  start(name: string, type: MetricType, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      type,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End tracking a performance metric.
   */
  end(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      metadata: { ...metric.metadata, ...additionalMetadata },
    };

    this.completed.push(completedMetric);
    this.metrics.delete(name);

    return duration;
  }

  /**
   * Measure the duration of a synchronous function.
   */
  measure<T>(name: string, type: MetricType, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.enabled) return fn();

    this.start(name, type, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Measure the duration of an asynchronous function.
   */
  async measureAsync<T>(
    name: string,
    type: MetricType,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name, type, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get all completed metrics.
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.completed];
  }

  /**
   * Get metrics by type.
   */
  getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.completed.filter((m) => m.type === type);
  }

  /**
   * Get statistics for a metric name.
   */
  getStats(name: string): {
    count: number;
    total: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const metrics = this.completed.filter((m) => m.name === name && m.duration !== undefined);

    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration!);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: metrics.length,
      total,
      avg: total / metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    };
  }

  /**
   * Log performance report to console.
   */
  report(): void {
    if (!this.enabled) return;

    const byType = new Map<MetricType, PerformanceMetric[]>();

    this.completed.forEach((metric) => {
      if (!byType.has(metric.type)) {
        byType.set(metric.type, []);
      }
      byType.get(metric.type)!.push(metric);
    });

    console.group("📊 Performance Report");

    byType.forEach((metrics, type) => {
      console.group(`${type.toUpperCase()} (${metrics.length} events)`);

      const names = new Set(metrics.map((m) => m.name));
      names.forEach((name) => {
        const stats = this.getStats(name);
        if (stats) {
          console.log(
            `${name}: avg ${stats.avg.toFixed(2)}ms, min ${stats.min.toFixed(2)}ms, max ${stats.max.toFixed(2)}ms (${stats.count} calls)`
          );
        }
      });

      console.groupEnd();
    });

    console.groupEnd();
  }

  /**
   * Clear all metrics.
   */
  clear(): void {
    this.metrics.clear();
    this.completed = [];
  }

  /**
   * Enable/disable monitoring.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/**
 * Global performance monitor instance.
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle a function call.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

/**
 * Memoize a function result.
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Batch multiple function calls.
 */
export function batchCalls<T>(
  callback: (items: T[]) => void,
  delay: number = 100
): (item: T) => void {
  let batch: T[] = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (item: T) => {
    batch.push(item);

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      callback(batch);
      batch = [];
      timeout = null;
    }, delay);
  };
}

/**
 * Check if code is running on the client side.
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if code is running on the server side.
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Get current memory usage (if available).
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if (!isClient() || !(performance as any).memory) return null;

  const memory = (performance as any).memory;

  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
  };
}

/**
 * Log component render count (for debugging).
 */
export function useRenderCount(componentName: string): void {
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
}
