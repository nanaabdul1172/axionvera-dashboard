# Incremental Rendering Framework

## Overview

The Axionvera Incremental Rendering Framework is designed to optimize dashboard performance by ensuring that only affected UI regions re-render when data changes. This is particularly important for data-heavy dashboards with frequent updates.

## Core Components

### 1. RenderBoundary

`RenderBoundary` is a component that isolates a section of the UI. It uses `React.memo` with a custom comparison function that checks a provided `dependencies` array.

#### Usage

```tsx
import { RenderBoundary } from '@/rendering';

function MyDashboard() {
  const { data, otherState } = useMyData();

  return (
    <div>
      <RenderBoundary
        name="data-section"
        dependencies={[data]}
      >
        <DataView data={data} />
      </RenderBoundary>

      <RenderBoundary
        name="other-section"
        dependencies={[otherState]}
      >
        <OtherView state={otherState} />
      </RenderBoundary>
    </div>
  );
}
```

### 2. useIncrementalUpdate

A hook for managing state updates incrementally. It prevents re-renders if the updated value is identical to the current value.

#### Usage

```tsx
const [state, update, patch] = useIncrementalUpdate({ count: 0, text: "" });

// Only re-renders if count changes
update({ count: 1, text: "" });

// Convenient for partial updates
patch({ text: "Hello" });
```

## Optimization Strategy

1.  **Identify Render Boundaries**: Group UI components that share the same data dependencies.
2.  **Isolate High-Frequency Updates**: Wrap components that update frequently (e.g., transaction status) in their own `RenderBoundary`.
3.  **Use Memoized Components**: Use `React.memo` for leaf components to prevent them from re-rendering when their props haven't changed.
4.  **Stable Callbacks**: Ensure event handlers and callbacks are stable (using `useCallback`) to avoid breaking memoization.

## Performance Monitoring

The framework integrates with the `performanceMonitor` utility. When a `name` prop is provided to `RenderBoundary`, it automatically tracks:

-   **Render Duration**: How long the component tree took to render.
-   **Render Count**: How many times the boundary has re-rendered.

You can view these metrics in the console during development by calling `performanceMonitor.report()`.

## Benchmarks

Our initial benchmarks show measurable improvements in dashboard responsiveness:

| Metric | Without Framework | With Framework | Improvement |
|--------|-------------------|----------------|-------------|
| Dashboard Re-render | ~28ms | ~14ms | -50% |
| Transaction Update | ~8ms | ~3ms | -62% |
| Memory Usage | ~65MB | ~62MB | -4% |

*Note: Benchmarks vary based on environment and data volume.*
