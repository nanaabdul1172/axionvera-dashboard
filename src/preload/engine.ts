import { ROUTE_PRELOAD_PROFILES, type AssetKind, type AssetPriority, type PreloadAsset, type RoutePreloadProfile } from "./assetManifest";

type IdleCallbackHandle = number;
type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type RequestIdleCallback = (callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }) => IdleCallbackHandle;

export interface PreloadRouter {
  prefetch: (href: string) => Promise<unknown>;
}

export interface AssetPreloadEngineOptions {
  router?: PreloadRouter;
  profiles?: RoutePreloadProfile[];
  maxConcurrent?: number;
  lazyDelayMs?: number;
  document?: Document;
  requestIdleCallback?: RequestIdleCallback;
  setTimeout?: typeof globalThis.setTimeout;
  now?: () => number;
}

export interface PreloadMetrics {
  requested: number;
  duplicatesAvoided: number;
  completed: number;
  failed: number;
  routeLatencySamples: number[];
  averageRouteLatencyMs: number;
}

export interface PreloadReport extends PreloadMetrics {
  route: string;
  predictedRoutes: string[];
  requestedAssets: string[];
}

const PRIORITY_WEIGHT: Record<AssetPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SUPPORTED_LINK_AS: Record<Exclude<AssetKind, "route">, string> = {
  script: "script",
  style: "style",
  image: "image",
  font: "font",
  fetch: "fetch",
};

export class AssetPreloadEngine {
  private profiles: RoutePreloadProfile[];
  private router?: PreloadRouter;
  private requested = new Set<string>();
  private inFlight = new Set<string>();
  private metrics: PreloadMetrics = { requested: 0, duplicatesAvoided: 0, completed: 0, failed: 0, routeLatencySamples: [], averageRouteLatencyMs: 0 };
  private document?: Document;
  private requestIdleCallback?: RequestIdleCallback;
  private setTimeoutImpl: typeof globalThis.setTimeout;
  private now: () => number;

  constructor(options: AssetPreloadEngineOptions = {}) {
    this.profiles = options.profiles ?? ROUTE_PRELOAD_PROFILES;
    this.router = options.router;
    this.document = options.document ?? (typeof document !== "undefined" ? document : undefined);
    const browserWindow = typeof window !== "undefined" ? (window as Window & { requestIdleCallback?: RequestIdleCallback }) : undefined;
    this.requestIdleCallback = options.requestIdleCallback ?? browserWindow?.requestIdleCallback?.bind(browserWindow);
    this.setTimeoutImpl = options.setTimeout ?? setTimeout;
    this.now = options.now ?? (() => performance.now());
  }

  preloadForRoute(route: string): PreloadReport {
    const profile = this.findProfile(route);
    const assets = this.prioritizeAssets(profile);
    const before = this.metrics.requested;
    assets.forEach((asset) => this.preloadAsset(asset));
    this.scheduleLazyPrefetch(profile.nextRoutes);
    return { ...this.metrics, route, predictedRoutes: profile.nextRoutes, requestedAssets: Array.from(this.requested).slice(before) };
  }

  preloadAsset(asset: PreloadAsset): boolean {
    const key = `${asset.as}:${asset.href}`;
    if (this.requested.has(key) || this.inFlight.has(key)) {
      this.metrics.duplicatesAvoided += 1;
      return false;
    }
    this.requested.add(key);
    this.inFlight.add(key);
    this.metrics.requested += 1;

    if (asset.as === "route") {
      void this.router?.prefetch(asset.href).then(() => this.markComplete(key)).catch(() => this.markFailed(key));
      if (!this.router) this.markComplete(key);
      return true;
    }

    const link = this.document?.createElement("link");
    if (!link) {
      this.markComplete(key);
      return true;
    }
    link.rel = "preload";
    link.href = asset.href;
    link.as = SUPPORTED_LINK_AS[asset.as];
    if (asset.crossOrigin) link.crossOrigin = asset.crossOrigin;
    if (asset.type) link.type = asset.type;
    link.onload = () => this.markComplete(key);
    link.onerror = () => this.markFailed(key);
    this.document?.head.appendChild(link);
    return true;
  }

  trackNavigationStart(): () => number {
    const start = this.now();
    return () => {
      const duration = this.now() - start;
      this.metrics.routeLatencySamples.push(duration);
      this.metrics.averageRouteLatencyMs = this.metrics.routeLatencySamples.reduce((sum, value) => sum + value, 0) / this.metrics.routeLatencySamples.length;
      return duration;
    };
  }

  getMetrics(): PreloadMetrics {
    return { ...this.metrics, routeLatencySamples: [...this.metrics.routeLatencySamples] };
  }

  reset(): void {
    this.requested.clear();
    this.inFlight.clear();
    this.metrics = { requested: 0, duplicatesAvoided: 0, completed: 0, failed: 0, routeLatencySamples: [], averageRouteLatencyMs: 0 };
  }

  private findProfile(route: string): RoutePreloadProfile {
    return this.profiles.find((profile) => profile.route === route) ?? { route, assets: [], nextRoutes: ["/dashboard"] };
  }

  private prioritizeAssets(profile: RoutePreloadProfile): PreloadAsset[] {
    const predictedRouteAssets = profile.nextRoutes.map<PreloadAsset>((href) => ({ href, as: "route", priority: "medium" }));
    return [...profile.assets, ...predictedRouteAssets].sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
  }

  private scheduleLazyPrefetch(routes: string[]): void {
    const task = () => routes.forEach((href) => this.preloadAsset({ href, as: "route", priority: "low" }));
    if (this.requestIdleCallback) {
      this.requestIdleCallback(task, { timeout: 1500 });
      return;
    }
    this.setTimeoutImpl(task, 250);
  }

  private markComplete(key: string): void {
    this.inFlight.delete(key);
    this.metrics.completed += 1;
  }

  private markFailed(key: string): void {
    this.inFlight.delete(key);
    this.metrics.failed += 1;
  }
}

export const dashboardAssetPreloader = new AssetPreloadEngine();
