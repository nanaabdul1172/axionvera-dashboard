# Unified Dashboard Data Pipeline

The dashboard data pipeline centralizes the lifecycle for module data so pages do not need to duplicate fetch, transform, cache, and refresh logic.

## Pipeline stages

1. **Fetch**: a module provides a `fetcher` that reads from the SDK, API, or browser source. The fetcher receives an abort signal and clock helper.
2. **Transform and normalize**: modules can provide a transformer to convert raw responses into view-ready data. `normalizeArrayById` is available for entity maps keyed by stable identifiers.
3. **Cache**: `DashboardDataPipeline` reads from a cache adapter before fetching. Fresh entries return immediately and expired entries are refreshed.
4. **Synchronization**: concurrent reads for the same pipeline share one in-flight request, minimizing duplicate fetches. Subscribers are notified whenever network data updates the cache.
5. **Invalidation**: modules can explicitly invalidate a cache key when wallet, network, or filter context changes.

## Cache strategy

The default browser cache uses `LocalStoragePipelineCache` with the `axionvera:pipeline` prefix. Tests and server-side callers can use `MemoryPipelineCache`. Entries include `updatedAt` and `expiresAt` timestamps so each module can choose its own TTL.

## React integration

`useDashboardDataPipeline` exposes `data`, `isLoading`, `error`, `source`, `updatedAt`, `refresh`, and `invalidate`. The hook subscribes to pipeline updates, reads cached data first, and supports forced refreshes for manual reload actions.

## Example

```ts
const pipeline = new DashboardDataPipeline({
  key: `analytics:${walletAddress}`,
  ttlMs: 5 * 60 * 1000,
  cache: defaultDashboardPipelineCache,
  fetcher: () => sdk.getAnalytics({ walletAddress, network }),
  transform: normalizeAnalyticsResponse,
});
```
