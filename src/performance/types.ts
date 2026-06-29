export interface ProfilerConfig {
  enabled: boolean;
  slowRenderThreshold: number;
  slowNetworkThreshold: number;
  maxMetrics: number;
  reportOnUnload: boolean;
}

export interface RenderProfile {
  componentName: string;
  renderCount: number;
  lastDuration: number;
  avgDuration: number;
  totalDuration: number;
  slowRenders: number;
}

export interface NetworkProfile {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  slow: boolean;
}

export interface StateUpdateProfile {
  storeName: string;
  updateCount: number;
  lastUpdatedAt: number;
}

export interface ProfilingReport {
  generatedAt: number;
  sessionDuration: number;
  renders: RenderProfile[];
  network: NetworkProfile[];
  stateUpdates: StateUpdateProfile[];
  bottlenecks: string[];
}
