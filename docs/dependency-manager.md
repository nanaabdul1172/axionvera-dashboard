# Dashboard Widget Dependency Manager

The Dashboard Widget Dependency Manager is a centralized system for tracking relationships between widgets and their data sources. It ensures that shared resources are loaded efficiently and that widgets are rendered in the correct order based on their dependencies.

## Architecture

The system consists of three main parts:

1.  **Graph Utility (`src/core/dependency/Graph.ts`)**: A low-level directed graph implementation that supports topological sorting and cycle detection.
2.  **Dependency Manager (`src/core/dependency/DependencyManager.ts`)**: A business-logic layer that manages `Widget` and `DataSource` registrations and uses the Graph utility to resolve loading orders.
3.  **Widget Registry (`src/widgets/registry.ts`)**: The application-level configuration where all widgets and data sources are defined.

## Key Concepts

### Data Source

A `DataSource` represents a piece of data that one or more widgets need. It defines a `loader` function which is an asynchronous operation (like an API call).

```typescript
interface DataSource {
  id: string;
  name: string;
  loader: () => Promise<any>;
}
```

### Widget

A `Widget` represents a UI component on the dashboard. It declares its dependencies, which can be either `DataSource` IDs or other `Widget` IDs.

```typescript
interface Widget {
  id: string;
  name: string;
  dependencies: string[];
}
```

## Dependency Rules

- **Shared Resources**: If multiple widgets depend on the same `DataSource`, the loader for that data source is executed only once.
- **Loading Order**: The system uses topological sorting to ensure that all dependencies are resolved and loaded before the dependent widget or data source is initialized.
- **Cycle Detection**: Circular dependencies (e.g., Widget A depends on Widget B, and Widget B depends on Widget A) are strictly prohibited and will result in an error during registration.

## Usage

### Registering a Widget

To add a new widget to the dashboard, register it in `src/widgets/registry.ts`:

```typescript
const myWidget: DashboardWidget = {
  id: "my-widget",
  name: "My Widget",
  dependencies: ["some-data-source"],
  component: MyComponent
};

manager.registerWidget(myWidget);
```

### Loading Widgets

The `useWidgetLoading` hook orchestrates the loading process:

```typescript
const { loadingOrder, isLoading, error } = useWidgetLoading();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;

return (
  <div>
    {loadingOrder.map(id => {
      const WidgetComp = getWidgetComponent(id);
      return WidgetComp ? <WidgetComp key={id} /> : null;
    })}
  </div>
);
```

## Performance Considerations

By centralizing dependency management, we avoid redundant network requests for shared data. The topological sort ensures that we don't start loading a widget until all its required data is ready, preventing "waterfall" loading patterns and flickering UI.
