# Dashboard Asset Preloading Strategy

The dashboard uses `AssetPreloadEngine` to predict the next routes a user is likely to visit and preload only the resources that can reduce perceived navigation latency.

## Strategy

- Route profiles in `src/preload/assetManifest.ts` describe critical assets and likely next routes for each dashboard page.
- Assets are sorted by priority: `critical`, `high`, `medium`, then `low`.
- Route assets use Next.js `router.prefetch` so page bundles are warmed through the framework cache.
- Non-route assets are added as `<link rel="preload">` tags with the correct `as` attribute.
- Lazy prefetching runs during `requestIdleCallback` when available, with a timeout fallback for browsers without idle callbacks.

## Duplicate prevention

Every preload is keyed by asset type and href. The engine tracks requested and in-flight resources, so repeated navigation predictions do not create duplicate prefetch calls or duplicate preload tags.

## Benchmarking and observability

The engine records route navigation timing samples through `trackNavigationStart()`. `_app.tsx` emits these samples alongside existing page-view diagnostics as `preloadLatencyMs` and `preloadMetrics`, making it possible to compare warmed navigation against cold navigation during browser performance runs.

## Extending profiles

Add a profile when a new dashboard route is introduced:

```ts
{
  route: "/new-route",
  assets: [{ href: "/dashboard", as: "route", priority: "high" }],
  nextRoutes: ["/dashboard"],
}
```

Keep profiles focused on resources that are likely to be used soon. Avoid preloading large or rarely needed assets because doing so can increase bandwidth usage without improving navigation latency.
