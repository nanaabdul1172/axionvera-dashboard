import { recordRenderMetric, recordLifecycleEvent, getMetrics, clearMetrics, generateProfilingReport } from '../../src/utils/profilerUtils';

describe('Profiler Utils', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('should record render metrics', () => {
    recordRenderMetric('TestComponent', 10);
    recordRenderMetric('TestComponent', 15);

    const metrics = getMetrics();
    expect(metrics).toHaveLength(2);
    expect(metrics[0].type).toBe('render');
    expect(metrics[0].duration).toBe(10);
  });

  it('should record lifecycle events', () => {
    recordLifecycleEvent('TestComponent', 'mount', 5);
    recordLifecycleEvent('TestComponent', 'unmount');
    
    const metrics = getMetrics();
    expect(metrics).toHaveLength(2);
    expect(metrics[0].type).toBe('mount');
    expect(metrics[1].type).toBe('unmount');
  });

  it('should generate profiling report and identify inefficient components', () => {
    // 12 renders taking 2ms each -> fast but too many renders (12 > 10)
    for (let i = 0; i < 12; i++) {
      recordRenderMetric('FrequentComponent', 2);
    }

    // 2 renders taking 20ms each -> slow renders (20 > 16)
    recordRenderMetric('SlowComponent', 20);
    recordRenderMetric('SlowComponent', 20);

    // 2 renders taking 2ms each -> optimal
    recordRenderMetric('OptimalComponent', 2);
    recordRenderMetric('OptimalComponent', 2);

    const report = generateProfilingReport();
    
    expect(report).toHaveLength(3);
    
    const frequent = report.find(r => r.componentName === 'FrequentComponent');
    expect(frequent?.isInefficient).toBe(true);

    const slow = report.find(r => r.componentName === 'SlowComponent');
    expect(slow?.isInefficient).toBe(true);

    const optimal = report.find(r => r.componentName === 'OptimalComponent');
    expect(optimal?.isInefficient).toBe(false);
  });
});
