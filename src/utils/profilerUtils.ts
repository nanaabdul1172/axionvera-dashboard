export interface ProfilerMetric {
  componentName: string;
  type: 'render' | 'mount' | 'unmount' | 'stateUpdate';
  duration?: number;
  timestamp: number;
}

// In-memory store for profiler metrics
const metricsStore: ProfilerMetric[] = [];

export function recordRenderMetric(componentName: string, duration: number) {
  metricsStore.push({
    componentName,
    type: 'render',
    duration,
    timestamp: performance.now(),
  });
}

export function recordLifecycleEvent(componentName: string, type: 'mount' | 'unmount' | 'stateUpdate', duration?: number) {
  metricsStore.push({
    componentName,
    type,
    duration,
    timestamp: performance.now(),
  });
}

export function getMetrics() {
  return [...metricsStore];
}

export function clearMetrics() {
  metricsStore.length = 0;
}

export function generateProfilingReport() {
  const componentStats: Record<string, { renders: number; totalRenderTime: number; averageRenderTime: number }> = {};

  metricsStore.forEach((metric) => {
    if (metric.type === 'render' && metric.duration !== undefined) {
      if (!componentStats[metric.componentName]) {
        componentStats[metric.componentName] = { renders: 0, totalRenderTime: 0, averageRenderTime: 0 };
      }
      
      const stats = componentStats[metric.componentName];
      stats.renders += 1;
      stats.totalRenderTime += metric.duration;
      stats.averageRenderTime = stats.totalRenderTime / stats.renders;
    }
  });

  return Object.entries(componentStats).map(([name, stats]) => ({
    componentName: name,
    ...stats,
    isInefficient: stats.averageRenderTime > 16 || stats.renders > 10 // e.g. takes longer than a frame (16ms) or renders too often
  }));
}
