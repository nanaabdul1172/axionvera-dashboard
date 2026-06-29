# Observability Architecture

## Overview

The observability framework provides structured diagnostics, performance telemetry, error reporting, and operational metrics. It is organized into four layers: **Logging**, **Diagnostics**, **Performance**, and **Hooks**, each building on the layer below.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React Hooks                        │
│  useDiagnostics  useDiagnosticEvents  useRenderTiming│
│  useErrorLogger  useMetricStats      useAsyncTiming  │
│  useDiagnosticBuffer  useMetricsSnapshot             │
├─────────────────────────────────────────────────────┤
│              Diagnostics (src/diagnostics/)           │
│  emit()  getEvents()  getErrorEvents()  getStats()   │
├─────────────────────────────────────────────────────┤
│              Performance (src/performance/)           │
│  startMark/endMark  recordMetric  measureAsync       │
│  getMetricStats (P50/P95/P99)  getAggregatedMetrics  │
├─────────────────────────────────────────────────────┤
│            Structured Logger (src/logger/)            │
│  logger.debug/info/warn/error                        │
│  configureLogger()  addTransport()                   │
│  LogLevel: debug | info | warn | error               │
└─────────────────────────────────────────────────────┘
```

## Layers

### 1. Logger (`src/logger/logger.ts`)

The foundational layer. Provides structured JSON logging with configurable levels.

**Key features:**
- **Log levels**: `debug`, `info`, `warn`, `error` with numeric ordering
- **Runtime configuration**: `configureLogger({ level, enabled })` - change level without restart
- **Transport system**: `addTransport(fn)` to forward log entries to external sinks (file, remote, store)
- **Module scoping**: Optional `module` parameter on every log call for traceability
- **Console output**: `error` → `console.error`, `warn` → `console.warn`, others → `console.log`

```typescript
import { logger, configureLogger, addTransport } from '@/logger';

configureLogger({ level: 'info' });

addTransport((entry) => {
  sendToServer(entry);
});

logger.info('User logged in', { userId: 'abc-123' }, 'auth');
```

### 2. Diagnostics (`src/diagnostics/index.ts`)

Builds on the logger. Standardized event system for application-level diagnostics.

**Key features:**
- **Standardized event types**: `DiagnosticEventType` enum covers component lifecycle, API calls, navigation, user actions, state changes, performance warnings, error boundaries, and network status
- **In-memory buffer**: Configurable capacity (`maxEvents`), LIFO order, automatic pruning
- **Filtering**: By type, level (`info`|`warn`|`error`), and time range (`since`)
- **Stats**: `getStats()` returns totals, breakdown by type/level, and recent error count (last 5 min)
- **Auto-logging**: Every `emit()` call automatically logs to the logger at debug level

```typescript
import { emit, getEvents, DiagnosticEventType } from '@/diagnostics';

emit(DiagnosticEventType.API_REQUEST, {
  source: 'UsersPage',
  data: { endpoint: '/api/users' },
});

const errors = getErrorEvents();
const stats = getStats();
```

### 3. Performance (`src/performance/performance.ts`)

Runtime metrics and performance telemetry. Supports manual marking and automatic measurement.

**Key features:**
- **Performance marks**: `startMark`/`endMark` for precise timing with metadata
- **Function wrapping**: `measureSync`/`measureAsync` automatically measure and record
- **Metrics recording**: `recordMetric(name, type, value, unit, tags)` for arbitrary data
- **Percentile computation**: `getMetricStats()` returns P50, P95, P99 alongside count/avg/min/max
- **Aggregation**: `getAggregatedMetrics()` groups by type with average/total
- **Slow operation detection**: Configurable `slowThreshold` emits diagnostic warning events
- **Memory**: `getMemoryUsage()` returns JS heap usage (Chromium only)

```typescript
import { startMark, endMark, measureAsync, getMetricStats, MetricType } from '@/performance';

startMark('data-fetch');
const data = await fetch('/api/data');
endMark('data-fetch');

const result = await measureAsync('complex-op', MetricType.API_CALL, async () => {
  return await processData();
});

const stats = getMetricStats('data-fetch');
console.log(stats?.p95); // 95th percentile duration
```

### 4. Hooks (`src/hooks/useDiagnostics.ts`, `src/hooks/useRuntimeMetrics.ts`)

React integration layer. Bridges the framework to component lifecycles.

**Diagnostics hooks:**
- `useDiagnostics(componentName)` - auto-emits mount/unmount, returns `trackEvent`
- `useDiagnosticEvents(filter?)` - live-polling event list
- `useDiagnosticStats()` - live-polling stats
- `useErrorLogger(componentName)` - structured error/warning logging
- `useDiagnosticBuffer(componentName)` - batched event flush and clear

**Performance hooks:**
- `useRenderTiming(componentName)` - automatically records render duration
- `useComponentTiming(componentName)` - records mount/unmount lifecycle timing
- `useAsyncTiming(name, fn)` - wraps async functions with timing
- `useMetricsSnapshot(refreshMs?)` - live snapshot of all metrics, marks, and aggregations
- `useSlowRenderDetection(componentName, threshold?)` - warns on renders exceeding threshold
- `useMetricStats(name)` - live stats for a specific metric
- `usePerformanceCleanup()` - clear all metrics and marks on unmount

```tsx
function MyComponent() {
  useDiagnostics('MyComponent');
  useRenderTiming('MyComponent');

  const { logError } = useErrorLogger('MyComponent');

  const handleClick = async () => {
    try {
      await saveData();
    } catch (err) {
      logError(err as Error);
    }
  };
}
```

## Configuration Reference

### Logger
```typescript
configureLogger({ level: 'debug' | 'info' | 'warn' | 'error', enabled: boolean })
addTransport((entry: LogEntry) => void)
clearTransports()
getLogLevel()
```

### Diagnostics
```typescript
configureDiagnostics({ maxEvents: number, enabled: boolean })
```

### Performance
```typescript
configurePerformance({ enabled: boolean, maxMarks: number, maxMetrics: number, slowThreshold: number })
```

## Data Flow

1. **Components** use hooks or directly call diagnostics/performance APIs
2. **Diagnostics** stores events in memory and auto-logs to the **Logger**
3. **Performance** records metrics and can emit diagnostic warnings for slow operations
4. **Logger** writes to console and forwards to registered **Transports**
5. **Tests** validate each layer independently using the in-memory stores

## Testing Strategy

- **Unit tests** validate each layer independently
- Logger tests mock console and verify transport/suppression behavior
- Diagnostics tests verify event lifecycle, filtering, stats, and capacity limits
- Performance tests verify marks, metrics, sync/async measurement, aggregation, and edge cases
- All tests run via Jest with `jest-environment-jsdom`

## Performance Impact

- Logger operations are O(1) with console I/O only for matching levels
- Diagnostics buffer is bounded (`maxEvents`, default 200) with O(1) unshift/pop
- Performance marks/metrics are bounded with configurable max capacities
- All operations are synchronous and non-blocking
- Hook-based measurements add minimal overhead (sub-millisecond per render)

Closes #251
