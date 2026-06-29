import { AssetPreloadEngine, type AssetPreloadEngineOptions, type RoutePreloadProfile } from "@/preload";

const profiles: RoutePreloadProfile[] = [
  {
    route: "/dashboard",
    assets: [
      { href: "/critical.css", as: "style", priority: "critical" },
      { href: "/analytics", as: "route", priority: "high" },
    ],
    nextRoutes: ["/analytics", "/governance"],
  },
];

function createEngine(overrides: Partial<AssetPreloadEngineOptions> = {}) {
  const router = { prefetch: jest.fn().mockResolvedValue(undefined) };
  const engine = new AssetPreloadEngine({
    profiles,
    router,
    document,
    requestIdleCallback: (callback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    },
    ...overrides,
  });
  return { engine, router };
}

describe("AssetPreloadEngine", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    jest.clearAllMocks();
  });

  it("preloads critical link assets and predicted routes", async () => {
    const { engine, router } = createEngine();

    const report = engine.preloadForRoute("/dashboard");
    await Promise.resolve();

    expect(document.head.querySelector('link[rel="preload"][href="/critical.css"]')).not.toBeNull();
    expect(router.prefetch).toHaveBeenCalledWith("/analytics");
    expect(router.prefetch).toHaveBeenCalledWith("/governance");
    expect(report.predictedRoutes).toEqual(["/analytics", "/governance"]);
    expect(engine.getMetrics().requested).toBe(3);
  });

  it("avoids duplicate requests across explicit and lazy preloads", async () => {
    const { engine, router } = createEngine();

    engine.preloadForRoute("/dashboard");
    engine.preloadForRoute("/dashboard");
    await Promise.resolve();

    expect(router.prefetch).toHaveBeenCalledTimes(2);
    expect(document.head.querySelectorAll('link[href="/critical.css"]')).toHaveLength(1);
    expect(engine.getMetrics().duplicatesAvoided).toBeGreaterThan(0);
  });

  it("records navigation latency samples for benchmarks", () => {
    let current = 100;
    const { engine } = createEngine({ now: () => current });

    const finish = engine.trackNavigationStart();
    current = 142;

    expect(finish()).toBe(42);
    expect(engine.getMetrics().averageRouteLatencyMs).toBe(42);
  });
});
