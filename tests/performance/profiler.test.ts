import { DashboardProfiler } from '../../src/performance/profiler';

describe('DashboardProfiler', () => {
  it('starts disabled in test env and can be enabled manually', () => {
    const profiler = new DashboardProfiler();
    expect(profiler.isEnabled()).toBe(false);
    profiler.enable();
    expect(profiler.isEnabled()).toBe(true);
    profiler.disable();
    expect(profiler.isEnabled()).toBe(false);
  });

  it('trackRender accumulates correct renderCount and avgDuration', () => {
    const profiler = new DashboardProfiler();
    profiler.enable();
    profiler.trackRender('TestComponent', 10);
    profiler.trackRender('TestComponent', 20);
    profiler.trackRender('TestComponent', 30);
    const report = profiler.generateReport();
    const render = report.renders.find(r => r.componentName === 'TestComponent');
    expect(render?.renderCount).toBe(3);
    expect(render?.totalDuration).toBe(60);
    expect(render?.avgDuration).toBeCloseTo(20);
    expect(render?.lastDuration).toBe(30);
  });

  it('trackRender correctly flags slow renders above threshold', () => {
    const profiler = new DashboardProfiler({ slowRenderThreshold: 16 });
    profiler.enable();
    profiler.trackRender('SlowComp', 5);
    profiler.trackRender('SlowComp', 20);
    profiler.trackRender('SlowComp', 25);
    const report = profiler.generateReport();
    const render = report.renders.find(r => r.componentName === 'SlowComp');
    expect(render?.slowRenders).toBe(2);
  });

  it('trackNetwork stores profiles and marks slow calls correctly', () => {
    const profiler = new DashboardProfiler({ slowNetworkThreshold: 1000 });
    profiler.enable();
    profiler.trackNetwork('/api/fast', 'GET', 200, 200);
    profiler.trackNetwork('/api/slow', 'POST', 1500, 200);
    const report = profiler.generateReport();
    expect(report.network).toHaveLength(2);
    const fast = report.network.find(n => n.url === '/api/fast');
    const slow = report.network.find(n => n.url === '/api/slow');
    expect(fast?.slow).toBe(false);
    expect(slow?.slow).toBe(true);
    expect(slow?.method).toBe('POST');
  });

  it('trackStateUpdate increments updateCount on repeated calls for same store', () => {
    const profiler = new DashboardProfiler();
    profiler.enable();
    profiler.trackStateUpdate('authStore');
    profiler.trackStateUpdate('authStore');
    profiler.trackStateUpdate('authStore');
    const report = profiler.generateReport();
    const store = report.stateUpdates.find(s => s.storeName === 'authStore');
    expect(store?.updateCount).toBe(3);
  });

  it('generateReport returns bottlenecks for slow avg renders', () => {
    const profiler = new DashboardProfiler({ slowRenderThreshold: 16 });
    profiler.enable();
    profiler.trackRender('SlowComp', 20);
    profiler.trackRender('SlowComp', 30);
    const report = profiler.generateReport();
    expect(report.bottlenecks.some(b => b.includes('SlowComp'))).toBe(true);
  });

  it('generateReport returns bottlenecks for slow network calls', () => {
    const profiler = new DashboardProfiler({ slowNetworkThreshold: 1000 });
    profiler.enable();
    profiler.trackNetwork('/api/data', 'GET', 2000, 200);
    const report = profiler.generateReport();
    expect(report.bottlenecks.some(b => b.includes('/api/data'))).toBe(true);
  });

  it('generateReport returns bottlenecks for high-frequency state updates (>50)', () => {
    const profiler = new DashboardProfiler();
    profiler.enable();
    for (let i = 0; i < 51; i++) {
      profiler.trackStateUpdate('busyStore');
    }
    const report = profiler.generateReport();
    expect(report.bottlenecks.some(b => b.includes('busyStore'))).toBe(true);
  });

  it('reset() clears all data and generateReport returns empty arrays', () => {
    const profiler = new DashboardProfiler();
    profiler.enable();
    profiler.trackRender('Comp', 10);
    profiler.trackNetwork('/api', 'GET', 100, 200);
    profiler.trackStateUpdate('store');
    profiler.reset();
    const report = profiler.generateReport();
    expect(report.renders).toHaveLength(0);
    expect(report.network).toHaveLength(0);
    expect(report.stateUpdates).toHaveLength(0);
    expect(report.bottlenecks).toHaveLength(0);
  });

  it('maxMetrics cap: adding more than maxMetrics network entries trims correctly', () => {
    const profiler = new DashboardProfiler({ maxMetrics: 5 });
    profiler.enable();
    for (let i = 0; i < 10; i++) {
      profiler.trackNetwork(`/api/${i}`, 'GET', 100, 200);
    }
    const report = profiler.generateReport();
    expect(report.network).toHaveLength(5);
  });
});
