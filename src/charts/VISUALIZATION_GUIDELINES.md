# Visualization Guidelines

Standards for building and using chart components in the Axionvera Dashboard.

---

## 1. Choosing a Chart Type

| Use Case | Component | Notes |
|---|---|---|
| Time series (single metric) | `LineChart` with `isArea` | Use gradient fill for balance/value trends |
| Time series (multiple metrics) | `ComposedChart` | Supports mixed bar+line with dual Y-axes |
| Period comparison | `BarChart` | Use `colors[]` for per-bar coloring |
| Categorical distribution | `PieChart` | Keep slices ≤ 6; group small values as "Other" |
| Protocol network topology | `NetworkDiagram` | Pass `ProtocolHealthMetric[]` from `protocolHealth.ts` |
| Statistical range (min/avg/max) | `StatisticsBar` | Use below time-series charts for context |
| Endpoint latency | `HealthLatencyBars` | Status-colored bars; already includes card shell |

---

## 2. Color Palette

Always use `CHART_COLORS` from `useChartTheme` for series colors. Never hardcode RGBA strings inside chart components.

```ts
import { CHART_COLORS } from "@/hooks/useChartTheme";

// Order (by semantic priority):
// [0] #6366f1  indigo   — primary brand / balance
// [1] #10b981  emerald  — rewards / success
// [2] #a855f7  purple   — secondary accent
// [3] #f59e0b  amber    — warning / degraded
// [4] #ef4444  red      — danger / down
// [5] #3b82f6  blue     — info
// [6] #f43f5e  rose     — secondary danger
// [7] #06b6d4  cyan     — tertiary accent
```

Status-semantic overrides (protocol health, transaction states):
- **operational** → `#10b981` (emerald)
- **degraded** → `#f59e0b` (amber)
- **down** → `#ef4444` (red)

---

## 3. Theming

Call `useChartTheme()` for all axis, grid, and tooltip tokens:

```ts
const theme = useChartTheme();
// theme.gridStroke       — CartesianGrid stroke
// theme.axisTickFill     — XAxis/YAxis tick fill
// theme.axisLineStroke   — XAxis axisLine stroke
// theme.referenceLineColor — ReferenceLine stroke
// theme.isDark           — boolean if needed for conditional logic
```

The hook reads from `ThemeContext` and returns light or dark values automatically. Charts wrapped in `ChartWrapper` adapt with no extra work.

---

## 4. Loading States

Replace the chart with `ChartSkeleton` at the same `height` while data loads:

```tsx
{isLoading
  ? <ChartSkeleton height={300} />
  : <LineChart data={data} height={300} />}
```

Or pass `isLoading` directly to any chart component:

```tsx
<LineChart data={data} isLoading={isLoading} height={300} />
```

Never render an empty Recharts chart while loading — it produces invisible axis lines.

---

## 5. Empty States

`LineChart`, `BarChart`, `ComposedChart`, and `PieChart` automatically render an empty state when `data.length === 0`.

```tsx
<BarChart data={data} height={300} />
```

If you need a custom empty-state message, wrap the chart content with `ChartWrapper` directly:

```tsx
<ChartWrapper
  title="Transactions"
  isEmpty={data.length === 0}
  emptyMessage="No transactions in this period"
  height={300}
>
  <BarChart data={data} />
</ChartWrapper>
```

---

## 6. Error Handling

Wrap every chart in `ChartErrorBoundary` (or use `ChartWrapper`) when the chart receives runtime data:

```tsx
<ChartErrorBoundary chartTitle="APY History" onRetry={refetch}>
  <LineChart data={apyData} />
</ChartErrorBoundary>
```

Charts in static demo/preview contexts (e.g., design-system pages) do not need the boundary.

---

## 7. Accessibility

Every chart **must** include:

1. `role="img"` on the outermost wrapper — provided automatically by `ChartWrapper`
2. `aria-label` describing what the chart shows — set via the `title` and `description` props

```tsx
<LineChart
  data={data}
  title="Balance Trend"
  description="XLM vault balance over the last 30 days"
/>
```

For `NetworkDiagram` and `StatisticsBar`, the accessible description is auto-generated from the data values.

For `HealthLatencyBars`, the `role="progressbar"` on each bar includes `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.

---

## 8. Performance

- Wrap all data-transform logic in `useMemo` before passing to chart props
- Import via `LazyComponents.tsx` in page-level components — all charts are `ssr: false`
- Charts that appear only in a tab or modal should use the `Lazy*` variants

```tsx
import { LazyPerformanceChart } from "@/components/optimized/LazyComponents";

<LazyPerformanceChart balanceData={data} />
```

- Prefer `React.memo` on any custom chart that is a direct child of a context consumer

---

## 9. Data Export

Use `chartExport.ts` utilities to add download actions to chart cards:

```ts
import { exportTimeSeriesCSV, exportToJSON } from "@/utils/chartExport";

// CSV download
exportTimeSeriesCSV(balanceData, "balance-2025-06-28.csv");

// JSON with metadata
exportToJSON(analyticsData, "analytics.json", { includeMetadata: true });
```

Filename convention: `{metric-name}-{YYYY-MM-DD}.{ext}` so downloaded files are self-describing.

---

## 10. Adding a New Chart

Checklist:

- [ ] Create in `src/charts/` (primitive) or `src/components/visualizations/` (domain composition)
- [ ] Wrap in `ChartWrapper` or apply `role="img"` + `aria-label` manually
- [ ] Use `useChartTheme()` for all axis/grid/tooltip colors
- [ ] Use `ChartTooltip` as the Recharts `content` prop
- [ ] Apply `React.memo` to the exported component
- [ ] Export from `src/charts/index.ts`
- [ ] Add a lazy export in `src/components/optimized/LazyComponents.tsx`
- [ ] Write at minimum: a render smoke test and an `aria-label` assertion
