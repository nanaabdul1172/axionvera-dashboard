import type { ProfilerConfig, RenderProfile, NetworkProfile, StateUpdateProfile, ProfilingReport } from './types';

const DEFAULT_CONFIG: ProfilerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  slowRenderThreshold: 16,
  slowNetworkThreshold: 1000,
  maxMetrics: 500,
  reportOnUnload: true,
};

export class DashboardProfiler {
  private config: ProfilerConfig;
  private renders: Map<string, RenderProfile> = new Map();
  private network: NetworkProfile[] = [];
  private stateUpdates: Map<string, StateUpdateProfile> = new Map();
  private sessionStart: number = Date.now();

  constructor(config?: Partial<ProfilerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.reportOnUnload && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.config.enabled) {
          console.log('[DashboardProfiler] Session report:', this.generateReport());
        }
      });
    }
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  trackRender(componentName: string, durationMs: number): void {
    if (!this.config.enabled) return;

    const existing = this.renders.get(componentName);
    if (existing) {
      const newTotal = existing.totalDuration + durationMs;
      const newCount = existing.renderCount + 1;
      this.renders.set(componentName, {
        ...existing,
        renderCount: newCount,
        lastDuration: durationMs,
        totalDuration: newTotal,
        avgDuration: newTotal / newCount,
        slowRenders: existing.slowRenders + (durationMs > this.config.slowRenderThreshold ? 1 : 0),
      });
    } else {
      this.renders.set(componentName, {
        componentName,
        renderCount: 1,
        lastDuration: durationMs,
        avgDuration: durationMs,
        totalDuration: durationMs,
        slowRenders: durationMs > this.config.slowRenderThreshold ? 1 : 0,
      });
    }
  }

  trackNetwork(url: string, method: string, durationMs: number, status: number): void {
    if (!this.config.enabled) return;

    this.network.push({
      url,
      method,
      duration: durationMs,
      status,
      timestamp: Date.now(),
      slow: durationMs > this.config.slowNetworkThreshold,
    });

    if (this.network.length > this.config.maxMetrics) {
      this.network = this.network.slice(this.network.length - this.config.maxMetrics);
    }
  }

  trackStateUpdate(storeName: string): void {
    if (!this.config.enabled) return;

    const existing = this.stateUpdates.get(storeName);
    if (existing) {
      this.stateUpdates.set(storeName, {
        ...existing,
        updateCount: existing.updateCount + 1,
        lastUpdatedAt: Date.now(),
      });
    } else {
      this.stateUpdates.set(storeName, {
        storeName,
        updateCount: 1,
        lastUpdatedAt: Date.now(),
      });
    }
  }

  generateReport(): ProfilingReport {
    const renders = Array.from(this.renders.values());
    const network = [...this.network];
    const stateUpdates = Array.from(this.stateUpdates.values());
    const bottlenecks: string[] = [];

    renders
      .filter(r => r.avgDuration > this.config.slowRenderThreshold)
      .forEach(r => {
        bottlenecks.push(`Slow render: ${r.componentName} (avg ${r.avgDuration.toFixed(2)}ms)`);
      });

    const slowUrls = new Set(network.filter(n => n.slow).map(n => n.url));
    slowUrls.forEach(url => {
      const count = network.filter(n => n.url === url && n.slow).length;
      bottlenecks.push(`Slow network: ${url} (${count} slow call${count > 1 ? 's' : ''})`);
    });

    stateUpdates
      .filter(s => s.updateCount > 50)
      .forEach(s => {
        bottlenecks.push(`High-frequency state: ${s.storeName} (${s.updateCount} updates)`);
      });

    return {
      generatedAt: Date.now(),
      sessionDuration: Date.now() - this.sessionStart,
      renders,
      network,
      stateUpdates,
      bottlenecks,
    };
  }

  reset(): void {
    this.renders.clear();
    this.network = [];
    this.stateUpdates.clear();
    this.sessionStart = Date.now();
  }
}

export const profilerInstance = new DashboardProfiler();
