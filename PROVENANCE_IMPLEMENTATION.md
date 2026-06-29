# Dashboard Data Provenance & Traceability Layer

## Overview
Complex dashboards often combine multiple data sources, making it difficult to trace where displayed values originate and how they change over time. The Data Provenance Layer provides a framework to record how dashboard values are produced, transformed, and propagated across components, enabling easier debugging and auditability.

## Architecture

The framework consists of three main pillars:
1. **Metadata Schema:** (`src/types/provenance.ts`)
2. **Tracking Utilities:** (`src/utils/provenance.ts`)
3. **Diagnostics Viewer:** (`src/components/diagnostics/ProvenanceViewer.tsx`)

### 1. Metadata Schema
We use a wrapper type, `TrackedValue<T>`, to attach lineage data to any primitive or object.
- `source`: The origin of the data (e.g., "API: AxionveraVaultSdk.getBalances")
- `createdAt`: Timestamp of when the data was fetched or initialized
- `lineage`: An array of `TransformationStep` objects recording every function that modifies the value.

To maintain type safety without breaking backward compatibility, we expose the `MaybeTracked<T>` utility type:
```typescript
export type MaybeTracked<T> = T | TrackedValue<T>;
```

### 2. Tracking Utilities
The tracking utilities are designed to be entirely opt-in and conditionally active. **Provenance tracking is disabled in production to ensure zero performance overhead.** It is enabled locally by appending `?debug=true` to the URL.

- `createTrackedValue(value, source)`: Initializes tracking for a base value.
- `transformTrackedValue(trackedValue, operation, actor, transformFn)`: Applies a transformation to the value and logs the step to the lineage array.
- `extractValue(trackedValue)`: Safely extracts the raw value for rendering in the UI.

### 3. Diagnostics Workflow
To visualize the lineage of a value on the screen, developers can import and use the `<ProvenanceViewer />` component. When passed a `TrackedValue`, it renders a visual timeline of the data's journey. If tracking is disabled, or a raw primitive is passed, the component safely renders nothing.

## Testing
Comprehensive unit tests for the core utilities are located at `tests/debug/provenance.test.ts`.

## Suggested Workflow for New Components
1. **At the Source:** Wrap the raw data returned from the SDK or API using `createTrackedValue`.
2. **Component Props:** Update component interfaces to accept `MaybeTracked<Type>` instead of the raw `Type`.
3. **Transformations:** If the component formats or calculates new values based on the data, pass it through `transformTrackedValue`.
4. **Rendering:** Always wrap the final variable in `extractValue()` inside your JSX to ensure React receives a renderable primitive.
5. **Debugging:** Drop a `<ProvenanceViewer trackedValue={myValue} />` in the component for visual inspection during development.
