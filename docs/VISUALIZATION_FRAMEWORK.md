# Dashboard Visualization Framework

This document describes the reusable visualization framework used to standardize
charts, graphs, protocol metrics, and statistical visualizations across the
Axionvera dashboard.

## Goals

- **Consistency**: Every chart uses the same theme-aware container, tooltip,
  legend, and color tokens.
- **Accessibility**: Charts expose ARIA roles/labels, respect reduced-motion
  preferences, and provide loading/error/empty states.
- **Responsiveness**: All charts render inside `ResponsiveContainer` and adapt
  to their parent width.
- **Performance**: Memoized transformations, stable gradient ids, and
  deterministic color assignment reduce unnecessary re-renders.
- **Maintainability**: New chart types can be built from shared primitives
  without duplicating styling or accessibility logic.

## Architecture

```text
src/visualizations/          Framework primitives and public API
├── components/
│   ├── ChartContainer.tsx   Responsive wrapper with states + a11y
│   ├── ChartTooltip.tsx     Theme-aware tooltip
│   ├── ChartLegend.tsx      Theme-aware legend formatter
│   └── EmptyState.tsx       Consistent empty placeholder
├── hooks/
│   └── useChartTheme.ts     Resolves light/dark tokens from ThemeContext
├── theme.ts                 Color palettes and token builders
├── types.ts                 Shared TypeScript interfaces
├── utils/
│   └── colors.ts            Gradient ids, color scales, hex helpers
└── index.ts                 Public API

src/charts/                  Reusable low-level chart components
├── BarChart.tsx
├── LineChart.tsx
├── PieChart.tsx
├── ComposedChart.tsx
├── HealthLatencyBars.tsx
└── index.ts

src/components/visualizations/  Domain-specific chart components
├── APYChart.tsx
├── FlowChart.tsx
├── PerformanceChart.tsx
└── index.ts
```

## Quick Start

```tsx
import { BarChart } from "@/charts";

<BarChart
  data={[
    { label: "Jan", value: 120 },
    { label: "Feb", value: 200 },
  ]}
  title="Monthly Volume"
  accessibility={{ label: "Monthly volume bar chart" }}
/>
```

## Theming

The framework reads the active theme from `ThemeContext` and exposes tokens via
`useChartTheme()`:

```ts
const theme = useChartTheme();
// theme.background, theme.foreground, theme.grid, theme.series, ...
```

For SSR or Storybook, pass an explicit mode:

```ts
const theme = useChartTheme({ mode: "dark" });
```

Color palettes:

- `DEFAULT_SERIES_COLORS` – default dashboard palette.
- `COLORBLIND_SERIES_COLORS` – color-blind friendly alternative.

## Accessibility

- Every chart is wrapped in `role="img"` with an `aria-label`.
- Provide `accessibility.label` and `accessibility.description` for screen
  readers.
- Set `accessibility.hidden` for decorative charts.
- The container respects `prefers-reduced-motion` and disables entry
  transitions when requested.
- Loading, error, and empty states are announced via `role="status"` or
  `role="alert"`.

## Building a New Chart

Use `ChartContainer` and the theme hooks to keep behavior consistent:

```tsx
import { ChartContainer, ChartTooltip, useChartTheme } from "@/visualizations";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

export function MetricRadar({ data, title }) {
  const theme = useChartTheme();
  return (
    <ChartContainer data={data} title={title} accessibility={{ label: title }}>
      <RadarChart data={data}>
        <PolarGrid stroke={theme.grid} />
        <PolarAngleAxis dataKey="label" tick={{ fill: theme.muted }} />
        <Radar dataKey="value" stroke={theme.series[0]} fill={theme.series[0]} />
        <Tooltip content={<ChartTooltip />} />
      </RadarChart>
    </ChartContainer>
  );
}
```

## Performance Guidelines

1. Memoize derived data with `useMemo`.
2. Use `gradientId(key)` for stable SVG gradient identifiers.
3. Use `resolveColor(index)` instead of inline random colors.
4. Keep heavy formatting functions outside render closures or memoize them.

## Testing

Chart tests live in `tests/charts/` and `src/visualizations/__tests__/`. The
Jest setup mocks `ResizeObserver` so Recharts `ResponsiveContainer` renders in
jsdom.

Run chart tests:

```bash
npm test -- --testPathPattern="visualizations|tests/charts"
```

## Out of Scope

- Backend analytics pipelines.
- AI-generated charts.
- Full dashboard redesigns.

These items should be tracked as separate issues.
