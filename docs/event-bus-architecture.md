# Dashboard Event Bus Architecture

The dashboard event bus provides typed, centralized publish/subscribe messaging for modules, widgets, services, and plugins without requiring those parts of the app to import each other directly.

## Event lifecycle

```text
Publisher module
  │ publish(type, payload)
  ▼
EventBus creates immutable envelope
  │ id, timestamp, source, correlationId, depth, path
  ▼
Loop guard checks depth and repeated event path
  ▼
Subscribers run by priority
  │ higher priority first, insertion order for ties
  ▼
Subscriber cleanup removes handlers on dispose/unmount
```

## Subscription lifecycle

`eventBus.subscribe(type, handler, options)` returns an `unsubscribe` function. Components and plugins must call that function when they unmount or are disabled. React components can use `useEventBus`, which wires the cleanup into `useEffect` automatically.

## Loop prevention

Nested publishes are supported for event flows such as `widget:mounted` triggering `service:status`. The bus prevents infinite loops in two ways:

1. Re-publishing an event type already present in the active publish path throws `EventLoopPreventedError`.
2. Publish chains deeper than the configured `maxPublishDepth` throw `EventLoopPreventedError`.

## Event types

Core dashboard event types live in `DashboardEventMap` and include dashboard readiness, widget lifecycle, widget refresh, service status, plugin registration, plugin removal, and notification creation events. Extend this map when adding new cross-module events so payloads stay documented and type checked.

## Example

```ts
import { eventBus } from "@/events";

const unsubscribe = eventBus.subscribe(
  "widget:refresh",
  (event) => refreshWidget(event.payload.widgetId),
  { priority: 10, subscriberId: "widget-refresh-service" },
);

await eventBus.publish("widget:refresh", { widgetId: "vault", reason: "manual" }, { source: "toolbar" });

unsubscribe();
```
