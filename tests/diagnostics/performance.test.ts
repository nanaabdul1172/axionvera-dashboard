import {
  startMark,
  endMark,
  measureAsync,
  measureSync,
  recordMetric,
  getMarks,
  getMetrics,
  getMetricsByType,
  getMetricStats,
  getAggregatedMetrics,
  clearMetrics,
  clearMarks,
  configurePerformance,
  getMemoryUsage,
  MetricType,
} from '@/performance';

describe('Performance', () => {
  beforeEach(() => {
    configurePerformance({ enabled: true });
    clearMarks();
    clearMetrics();
  });

  describe('marks', () => {
    it('should start and end a mark', () => {
      startMark('test-mark', { component: 'Test' });
      const duration = endMark('test-mark');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null for unknown mark end', () => {
      const result = endMark('nonexistent');
      expect(result).toBeNull();
    });

    it('should store completed marks with timing info', () => {
      startMark('render', { component: 'MyComponent' });
      endMark('render', { extra: 'info' });
      const marks = getMarks();
      expect(marks).toHaveLength(1);
      expect(marks[0].name).toBe('render');
      expect(marks[0].duration).toBeGreaterThanOrEqual(0);
      expect(marks[0].metadata).toEqual({ component: 'MyComponent', extra: 'info' });
    });

    it('should clear marks', () => {
      startMark('a');
      endMark('a');
      expect(getMarks()).toHaveLength(1);
      clearMarks();
      expect(getMarks()).toHaveLength(0);
    });
  });

  describe('metrics', () => {
    it('should record runtime metrics', () => {
      recordMetric('api.fetch', MetricType.API_CALL, 150, 'ms', { endpoint: '/users' });
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('api.fetch');
      expect(metrics[0].value).toBe(150);
      expect(metrics[0].unit).toBe('ms');
      expect(metrics[0].tags).toEqual({ endpoint: '/users' });
    });

    it('should filter metrics by type', () => {
      recordMetric('r1', MetricType.RENDER, 10, 'ms');
      recordMetric('a1', MetricType.API_CALL, 200, 'ms');
      recordMetric('r2', MetricType.RENDER, 20, 'ms');

      const renders = getMetricsByType(MetricType.RENDER);
      expect(renders).toHaveLength(2);
      expect(renders.every(m => m.type === MetricType.RENDER)).toBe(true);
    });

    it('should compute metric stats', () => {
      recordMetric('fetch', MetricType.API_CALL, 100, 'ms');
      recordMetric('fetch', MetricType.API_CALL, 200, 'ms');
      recordMetric('fetch', MetricType.API_CALL, 300, 'ms');

      const stats = getMetricStats('fetch');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(3);
      expect(stats!.avg).toBe(200);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(300);
      expect(stats!.p50).toBe(200);
      expect(stats!.p95).toBe(300);
      expect(stats!.p99).toBe(300);
    });

    it('should return null for stats of nonexistent metric', () => {
      expect(getMetricStats('nothing')).toBeNull();
    });

    it('should aggregate metrics by type', () => {
      recordMetric('a', MetricType.RENDER, 10, 'ms');
      recordMetric('b', MetricType.RENDER, 30, 'ms');
      recordMetric('c', MetricType.API_CALL, 100, 'ms');

      const aggregated = getAggregatedMetrics();
      expect(aggregated.byType[MetricType.RENDER].count).toBe(2);
      expect(aggregated.byType[MetricType.RENDER].avgMs).toBe(20);
      expect(aggregated.byType[MetricType.RENDER].totalMs).toBe(40);
      expect(aggregated.byType[MetricType.API_CALL].count).toBe(1);
      expect(aggregated.byType[MetricType.API_CALL].avgMs).toBe(100);
    });

    it('should clear metrics', () => {
      recordMetric('x', MetricType.RENDER, 1, 'ms');
      expect(getMetrics()).toHaveLength(1);
      clearMetrics();
      expect(getMetrics()).toHaveLength(0);
    });
  });

  describe('measureSync', () => {
    it('should measure synchronous function', () => {
      const result = measureSync('sync-fn', MetricType.USER_INTERACTION, () => 42);
      expect(result).toBe(42);
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('sync-fn');
    });

    it('should propagate sync errors', () => {
      expect(() =>
        measureSync('fail', MetricType.USER_INTERACTION, () => { throw new Error('sync-error'); })
      ).toThrow('sync-error');
    });
  });

  describe('measureAsync', () => {
    it('should measure asynchronous function', async () => {
      const result = await measureAsync('async-fn', MetricType.API_CALL, async () => 99);
      expect(result).toBe(99);
      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
    });

    it('should propagate async errors', async () => {
      await expect(
        measureAsync('fail', MetricType.API_CALL, async () => { throw new Error('async-error'); })
      ).rejects.toThrow('async-error');
    });
  });

  describe('configuration', () => {
    it('should not record metrics when disabled', () => {
      configurePerformance({ enabled: false });
      recordMetric('x', MetricType.RENDER, 1, 'ms');
      expect(getMetrics()).toHaveLength(0);
    });

    it('should not create marks when disabled', () => {
      configurePerformance({ enabled: false });
      startMark('hidden');
      expect(endMark('hidden')).toBeNull();
    });
  });

  describe('memory', () => {
    it('should return null when memory API is unavailable', () => {
      const result = getMemoryUsage();
      expect(result).toBeNull();
    });
  });
});
